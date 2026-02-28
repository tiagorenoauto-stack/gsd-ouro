#!/usr/bin/env node

/**
 * GSD Ouro — Kit Sync (v0.9)
 * Motor de sincronização cross-project do Kit Ouro.
 * Registry central em ~/.gsd-ouro/registry.json
 *
 * Uso:
 *   const sync = require('./lib/kit-sync')
 *   sync.register('/path/to/project')
 *   sync.push()          // exporta padrões deste projeto
 *   sync.pull()           // importa padrões de outros projetos
 *   sync.status()         // diff entre projetos
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const os = require('os')

// ==================== PATHS ====================

const GLOBAL_DIR = () => path.join(os.homedir(), '.gsd-ouro')
const REGISTRY_FILE = () => path.join(GLOBAL_DIR(), 'registry.json')
const HUB_DIR = () => path.join(GLOBAL_DIR(), 'hub')
const HUB_PADROES = () => path.join(HUB_DIR(), 'padroes')
const HUB_KIT = () => path.join(HUB_DIR(), 'KIT_OURO.md')
const HUB_META = () => path.join(HUB_DIR(), 'meta.json')

function projectDir() {
  return process.cwd()
}

function projectKitDir() {
  return path.join(projectDir(), 'kit', 'padroes')
}

function projectKitOuro() {
  return path.join(projectDir(), '.ouro', 'KIT_OURO.md')
}

// ==================== HELPERS ====================

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function hash(content) {
  return crypto.createHash('md5').update(content).digest('hex').slice(0, 12)
}

function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch {
    return null
  }
}

function writeJSON(filePath, data) {
  ensureDir(path.dirname(filePath))
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

function timestamp() {
  return new Date().toISOString()
}

// ==================== REGISTRY ====================

/**
 * Carrega registry de projetos.
 */
function loadRegistry() {
  return readJSON(REGISTRY_FILE()) || { projects: [], last_sync: null }
}

function saveRegistry(registry) {
  writeJSON(REGISTRY_FILE(), registry)
}

/**
 * Registra o projeto atual no registry global.
 */
function register(projectPath) {
  const dir = projectPath || projectDir()
  const registry = loadRegistry()

  const existing = registry.projects.find(p => p.path === dir)
  if (existing) {
    existing.last_seen = timestamp()
    saveRegistry(registry)
    return { status: 'already-registered', project: existing }
  }

  // Ler nome do projeto de .ouro/PROJECT.md ou package.json
  let name = path.basename(dir)
  const projectMd = path.join(dir, '.ouro', 'PROJECT.md')
  if (fs.existsSync(projectMd)) {
    const content = fs.readFileSync(projectMd, 'utf-8')
    const match = content.match(/^#\s+(?:Projeto:\s*)?(.+)/m)
    if (match) name = match[1].trim()
  }

  const project = {
    name,
    path: dir,
    registered: timestamp(),
    last_seen: timestamp(),
    last_push: null,
    last_pull: null,
    patterns_count: 0
  }

  registry.projects.push(project)
  saveRegistry(registry)
  return { status: 'registered', project }
}

/**
 * Remove projeto do registry.
 */
function unregister(projectPath) {
  const dir = projectPath || projectDir()
  const registry = loadRegistry()
  const before = registry.projects.length
  registry.projects = registry.projects.filter(p => p.path !== dir)
  saveRegistry(registry)
  return { removed: registry.projects.length < before }
}

/**
 * Lista projetos registrados.
 */
function listProjects() {
  const registry = loadRegistry()
  return registry.projects.map(p => ({
    ...p,
    exists: fs.existsSync(p.path),
    is_current: p.path === projectDir()
  }))
}

// ==================== SCANNING ====================

/**
 * Escaneia padrões de um projeto.
 * Retorna array de { name, file, hash, size, modified }
 */
function scanPatterns(dir) {
  const padroesDir = dir ? path.join(dir, 'kit', 'padroes') : projectKitDir()
  if (!fs.existsSync(padroesDir)) return []

  const files = fs.readdirSync(padroesDir).filter(f => f.endsWith('.md'))
  return files.map(file => {
    const fullPath = path.join(padroesDir, file)
    const content = fs.readFileSync(fullPath, 'utf-8')
    const stat = fs.statSync(fullPath)
    const titleMatch = content.match(/^#\s+(.+)/m)
    return {
      name: titleMatch ? titleMatch[1].trim() : file.replace('.md', ''),
      file,
      hash: hash(content),
      size: content.length,
      modified: stat.mtime.toISOString(),
      content
    }
  })
}

/**
 * Escaneia padrões do hub central.
 */
function scanHub() {
  if (!fs.existsSync(HUB_PADROES())) return []

  const files = fs.readdirSync(HUB_PADROES()).filter(f => f.endsWith('.md'))
  return files.map(file => {
    const fullPath = path.join(HUB_PADROES(), file)
    const content = fs.readFileSync(fullPath, 'utf-8')
    const stat = fs.statSync(fullPath)
    const titleMatch = content.match(/^#\s+(.+)/m)
    return {
      name: titleMatch ? titleMatch[1].trim() : file.replace('.md', ''),
      file,
      hash: hash(content),
      size: content.length,
      modified: stat.mtime.toISOString(),
      content
    }
  })
}

// ==================== DIFF ====================

/**
 * Compara padrões locais com o hub.
 * Retorna { added, modified, removed, unchanged }
 */
function diff(localPatterns, hubPatterns) {
  const localMap = new Map(localPatterns.map(p => [p.file, p]))
  const hubMap = new Map(hubPatterns.map(p => [p.file, p]))

  const added = []     // no local mas não no hub
  const modified = []  // em ambos mas hash diferente
  const removed = []   // no hub mas não no local
  const unchanged = [] // mesmos em ambos

  for (const [file, local] of localMap) {
    const hub = hubMap.get(file)
    if (!hub) {
      added.push({ file, name: local.name, source: 'local' })
    } else if (local.hash !== hub.hash) {
      modified.push({
        file,
        name: local.name,
        local_hash: local.hash,
        hub_hash: hub.hash,
        local_modified: local.modified,
        hub_modified: hub.modified,
        local_size: local.size,
        hub_size: hub.size
      })
    } else {
      unchanged.push({ file, name: local.name })
    }
  }

  for (const [file, hub] of hubMap) {
    if (!localMap.has(file)) {
      removed.push({ file, name: hub.name, source: 'hub' })
    }
  }

  return { added, modified, removed, unchanged }
}

// ==================== PUSH ====================

/**
 * Exporta padrões do projeto atual para o hub central.
 * Não sobrescreve arquivos com hash diferente sem force=true.
 */
function push(options = {}) {
  const { force = false, files = null } = options
  const localPatterns = scanPatterns()
  const hubPatterns = scanHub()
  const delta = diff(localPatterns, hubPatterns)

  ensureDir(HUB_PADROES())

  const results = { pushed: [], skipped: [], conflicts: [] }

  // Meta do hub
  let meta = readJSON(HUB_META()) || { patterns: {}, last_update: null, push_history: [] }

  for (const pattern of localPatterns) {
    // Filtro se especificado
    if (files && !files.includes(pattern.file)) continue

    const hubFile = path.join(HUB_PADROES(), pattern.file)
    const isModified = delta.modified.some(m => m.file === pattern.file)

    if (isModified && !force) {
      results.conflicts.push({
        file: pattern.file,
        name: pattern.name,
        reason: 'Hub tem versão diferente. Use force=true para sobrescrever.'
      })
      continue
    }

    // Copiar para hub
    fs.writeFileSync(hubFile, pattern.content)
    meta.patterns[pattern.file] = {
      hash: pattern.hash,
      pushed_from: projectDir(),
      pushed_at: timestamp(),
      name: pattern.name
    }
    results.pushed.push({ file: pattern.file, name: pattern.name })
  }

  // Copiar KIT_OURO.md se existir
  const kitOuro = projectKitOuro()
  if (fs.existsSync(kitOuro)) {
    fs.copyFileSync(kitOuro, HUB_KIT())
  }

  // Atualizar meta
  meta.last_update = timestamp()
  meta.push_history.push({
    project: projectDir(),
    at: timestamp(),
    pushed: results.pushed.length,
    conflicts: results.conflicts.length
  })
  if (meta.push_history.length > 50) meta.push_history = meta.push_history.slice(-50)
  writeJSON(HUB_META(), meta)

  // Atualizar registry
  const registry = loadRegistry()
  const proj = registry.projects.find(p => p.path === projectDir())
  if (proj) {
    proj.last_push = timestamp()
    proj.patterns_count = localPatterns.length
    saveRegistry(registry)
  }

  return results
}

// ==================== PULL ====================

/**
 * Importa padrões do hub para o projeto atual.
 * Não sobrescreve modificados sem force=true.
 */
function pull(options = {}) {
  const { force = false, files = null } = options
  const localPatterns = scanPatterns()
  const hubPatterns = scanHub()

  if (hubPatterns.length === 0) {
    return { status: 'empty', message: 'Hub vazio. Faça push de um projeto primeiro.' }
  }

  const delta = diff(localPatterns, hubPatterns)
  const padroesDir = projectKitDir()
  ensureDir(padroesDir)

  const results = { pulled: [], skipped: [], conflicts: [], new: [] }

  for (const hubPattern of hubPatterns) {
    if (files && !files.includes(hubPattern.file)) continue

    const localFile = path.join(padroesDir, hubPattern.file)
    const isModified = delta.modified.some(m => m.file === hubPattern.file)
    const isNew = delta.removed.some(r => r.file === hubPattern.file)

    if (isModified && !force) {
      results.conflicts.push({
        file: hubPattern.file,
        name: hubPattern.name,
        reason: 'Local tem versão diferente. Use force=true para sobrescrever.'
      })
      continue
    }

    fs.writeFileSync(localFile, hubPattern.content)

    if (isNew) {
      results.new.push({ file: hubPattern.file, name: hubPattern.name })
    } else {
      results.pulled.push({ file: hubPattern.file, name: hubPattern.name })
    }
  }

  // Copiar KIT_OURO.md do hub se existir e local quiser
  if (fs.existsSync(HUB_KIT()) && options.include_kit) {
    const kitDest = projectKitOuro()
    ensureDir(path.dirname(kitDest))
    fs.copyFileSync(HUB_KIT(), kitDest)
  }

  // Atualizar registry
  const registry = loadRegistry()
  const proj = registry.projects.find(p => p.path === projectDir())
  if (proj) {
    proj.last_pull = timestamp()
    proj.patterns_count = scanPatterns().length
    saveRegistry(registry)
  }

  return results
}

// ==================== STATUS ====================

/**
 * Status completo: projetos, diff com hub, saúde do sync.
 */
function status() {
  const projects = listProjects()
  const localPatterns = scanPatterns()
  const hubPatterns = scanHub()
  const delta = diff(localPatterns, hubPatterns)
  const meta = readJSON(HUB_META()) || { patterns: {}, last_update: null, push_history: [] }

  const currentProject = projects.find(p => p.is_current)

  return {
    hub: {
      path: HUB_DIR(),
      patterns_count: hubPatterns.length,
      last_update: meta.last_update,
      total_pushes: meta.push_history.length
    },
    current_project: {
      name: currentProject?.name || path.basename(projectDir()),
      path: projectDir(),
      registered: !!currentProject,
      patterns_count: localPatterns.length,
      last_push: currentProject?.last_push || null,
      last_pull: currentProject?.last_pull || null
    },
    diff: {
      only_local: delta.added.length,
      only_hub: delta.removed.length,
      modified: delta.modified.length,
      in_sync: delta.unchanged.length,
      details: delta
    },
    projects_registered: projects.length,
    projects: projects
  }
}

/**
 * Diff detalhado de um arquivo específico entre local e hub.
 */
function fileDiff(filename) {
  const localPatterns = scanPatterns()
  const hubPatterns = scanHub()

  const local = localPatterns.find(p => p.file === filename)
  const hub = hubPatterns.find(p => p.file === filename)

  if (!local && !hub) return { status: 'not-found' }
  if (!local) return { status: 'only-hub', hub: { name: hub.name, size: hub.size, modified: hub.modified } }
  if (!hub) return { status: 'only-local', local: { name: local.name, size: local.size, modified: local.modified } }

  if (local.hash === hub.hash) {
    return { status: 'in-sync', file: filename, name: local.name }
  }

  // Diff simples: linhas diferentes
  const localLines = local.content.split('\n')
  const hubLines = hub.content.split('\n')
  const maxLines = Math.max(localLines.length, hubLines.length)
  const diffs = []

  for (let i = 0; i < maxLines; i++) {
    if (localLines[i] !== hubLines[i]) {
      diffs.push({
        line: i + 1,
        local: localLines[i] || '(ausente)',
        hub: hubLines[i] || '(ausente)'
      })
    }
  }

  return {
    status: 'diverged',
    file: filename,
    name: local.name,
    local: { hash: local.hash, size: local.size, modified: local.modified },
    hub: { hash: hub.hash, size: hub.size, modified: hub.modified },
    differences: diffs.length,
    diff_preview: diffs.slice(0, 20)
  }
}

// ==================== EXPORT ====================

module.exports = {
  register,
  unregister,
  listProjects,
  scanPatterns,
  scanHub,
  diff,
  push,
  pull,
  status,
  fileDiff
}

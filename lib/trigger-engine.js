#!/usr/bin/env node

/**
 * GSD Ouro — Trigger Engine v0.6
 *
 * Detecta QUANDO ativar cada padrao do Kit Ouro baseado em keywords e contexto.
 * Le kit/triggers.json e faz matching contra descricoes de tarefas.
 *
 * Uso:
 *   const { matchTriggers, getChecklist, buildContextInjection } = require('./trigger-engine')
 *   const matches = matchTriggers('criar nova pagina de formulario', 'executar')
 *   const context = buildContextInjection(matches)
 */

const fs = require('fs')
const path = require('path')

// ==================== CACHE ====================

let _triggersCache = null
let _triggersCacheTime = 0
const CACHE_TTL = 30000 // 30s

// ==================== CORE ====================

/**
 * Carrega triggers de kit/triggers.json com cache de 30s
 * @returns {object} Config de triggers { version, triggers[], checklists{} }
 */
function loadTriggers() {
  const now = Date.now()
  if (_triggersCache && (now - _triggersCacheTime) < CACHE_TTL) {
    return _triggersCache
  }

  const triggersPath = path.join(__dirname, '..', 'kit', 'triggers.json')
  if (!fs.existsSync(triggersPath)) {
    return { version: '0.0.0', triggers: [], checklists: {} }
  }

  try {
    _triggersCache = JSON.parse(fs.readFileSync(triggersPath, 'utf-8'))
    _triggersCacheTime = now
    return _triggersCache
  } catch {
    return { version: '0.0.0', triggers: [], checklists: {} }
  }
}

/**
 * Normaliza texto para matching: lowercase, remove acentos, trim
 * @param {string} text
 * @returns {string}
 */
function normalize(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Verifica se uma keyword aparece no texto normalizado.
 * Suporta keywords multi-palavra (ex: "criar pagina").
 * @param {string} normalizedText - Texto ja normalizado
 * @param {string} keyword - Keyword a buscar
 * @returns {boolean}
 */
function keywordMatch(normalizedText, keyword) {
  const normalizedKeyword = normalize(keyword)
  return normalizedText.includes(normalizedKeyword)
}

/**
 * Busca triggers que correspondem a uma descricao de tarefa.
 *
 * @param {string} taskDescription - Descricao da tarefa do usuario
 * @param {string} context - Contexto atual: 'executar'|'planejar'|'rapido'|'debug'|'verificar'|'novo-projeto'
 * @returns {Array<{id, pattern_file, priority, auto_inject, checklist, matched_keywords}>}
 */
function matchTriggers(taskDescription, context) {
  const config = loadTriggers()
  if (!config.triggers || config.triggers.length === 0) return []

  const normalizedDesc = normalize(taskDescription)
  const matches = []

  for (const trigger of config.triggers) {
    // Filtrar por contexto
    if (context && trigger.contexts && !trigger.contexts.includes(context)) {
      continue
    }

    // Buscar keywords que fazem match
    const matchedKeywords = (trigger.keywords || []).filter(kw =>
      keywordMatch(normalizedDesc, kw)
    )

    if (matchedKeywords.length > 0) {
      matches.push({
        id: trigger.id,
        pattern_file: trigger.pattern_file,
        priority: trigger.priority || 99,
        auto_inject: trigger.auto_inject || false,
        checklist: trigger.checklist || null,
        matched_keywords: matchedKeywords,
        relevance: matchedKeywords.length // mais keywords = mais relevante
      })
    }
  }

  // Ordenar: prioridade ASC (1 primeiro), relevancia DESC
  matches.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority
    return b.relevance - a.relevance
  })

  return matches
}

/**
 * Retorna os itens de checklist para um trigger especifico.
 * @param {string} checklistId - ID do checklist (ex: 'golden-model', '5-layer-field')
 * @returns {string[]} Array de itens do checklist, ou [] se nao encontrado
 */
function getChecklist(checklistId) {
  if (!checklistId) return []
  const config = loadTriggers()
  return config.checklists?.[checklistId] || []
}

/**
 * Le o conteudo de um arquivo de padrao (.md).
 * @param {string} patternFile - Caminho relativo (ex: 'kit/padroes/golden-model.md')
 * @returns {string} Conteudo do arquivo, ou string vazia se nao encontrado
 */
function readPattern(patternFile) {
  const fullPath = path.join(__dirname, '..', patternFile)
  if (!fs.existsSync(fullPath)) return ''

  try {
    const content = fs.readFileSync(fullPath, 'utf-8').trim()
    // Limitar a 200 linhas para nao poluir o contexto
    const lines = content.split('\n')
    if (lines.length > 200) {
      return lines.slice(0, 200).join('\n') + '\n\n[... truncado em 200 linhas]'
    }
    return content
  } catch {
    return ''
  }
}

/**
 * Constroi string de contexto para injecao no prompt.
 * Apenas padroes com auto_inject=true sao incluidos.
 *
 * @param {Array} matches - Resultado de matchTriggers()
 * @param {object} [options]
 * @param {number} [options.maxPatterns=3] - Maximo de padroes a injetar
 * @param {boolean} [options.includeAll=false] - Incluir mesmo sem auto_inject
 * @returns {string} Contexto formatado para injecao, ou '' se vazio
 */
function buildContextInjection(matches, options = {}) {
  const { maxPatterns = 3, includeAll = false } = options

  const eligible = includeAll
    ? matches
    : matches.filter(m => m.auto_inject)

  if (eligible.length === 0) return ''

  const selected = eligible.slice(0, maxPatterns)
  const parts = []

  parts.push('=== PADROES DO KIT OURO (auto-detectados) ===\n')

  for (const match of selected) {
    const content = readPattern(match.pattern_file)
    if (!content) continue

    // Extrair apenas as secoes essenciais (Quando Usar + Checklist)
    const summary = extractSummary(content)
    parts.push(`--- ${match.id.toUpperCase()} (keywords: ${match.matched_keywords.join(', ')}) ---`)
    parts.push(summary)
    parts.push('')
  }

  // Adicionar checklists combinados
  const allChecklistItems = []
  for (const match of selected) {
    if (match.checklist) {
      const items = getChecklist(match.checklist)
      if (items.length > 0) {
        allChecklistItems.push(`[${match.id}]`)
        items.forEach(item => allChecklistItems.push(`  - [ ] ${item}`))
      }
    }
  }

  if (allChecklistItems.length > 0) {
    parts.push('=== CHECKLISTS OBRIGATORIOS ===')
    parts.push(allChecklistItems.join('\n'))
  }

  return parts.join('\n')
}

/**
 * Extrai resumo de um padrao: titulo, Quando Usar e Checklist.
 * @param {string} content - Conteudo completo do .md
 * @returns {string} Resumo compacto
 */
function extractSummary(content) {
  const lines = content.split('\n')
  const parts = []
  let inSection = null
  let sectionContent = []

  for (const line of lines) {
    // Detectar titulo principal
    if (line.startsWith('# ') && parts.length === 0) {
      parts.push(line)
      continue
    }

    // Detectar secoes de interesse
    if (line.startsWith('## Quando Usar')) {
      inSection = 'quando'
      sectionContent = [line]
      continue
    }
    if (line.startsWith('## Checklist')) {
      inSection = 'checklist'
      sectionContent = [line]
      continue
    }
    if (line.startsWith('## ') && inSection) {
      // Fim da secao atual
      if (inSection === 'quando' || inSection === 'checklist') {
        parts.push(sectionContent.join('\n'))
      }
      inSection = null
      sectionContent = []
      continue
    }

    if (inSection) {
      sectionContent.push(line)
    }
  }

  // Flush ultima secao
  if (inSection && sectionContent.length > 0) {
    parts.push(sectionContent.join('\n'))
  }

  return parts.join('\n\n')
}

/**
 * Lista todos os triggers disponiveis (para debug/info).
 * @returns {Array<{id, keywords_count, contexts, priority, auto_inject, has_checklist}>}
 */
function listTriggers() {
  const config = loadTriggers()
  return (config.triggers || []).map(t => ({
    id: t.id,
    keywords_count: (t.keywords || []).length,
    contexts: t.contexts || [],
    priority: t.priority,
    auto_inject: t.auto_inject,
    has_checklist: !!t.checklist
  }))
}

/**
 * Invalida o cache de triggers (utl apos editar triggers.json).
 */
function invalidateCache() {
  _triggersCache = null
  _triggersCacheTime = 0
}

// ==================== EXPORTS ====================

module.exports = {
  loadTriggers,
  matchTriggers,
  getChecklist,
  readPattern,
  buildContextInjection,
  listTriggers,
  invalidateCache
}

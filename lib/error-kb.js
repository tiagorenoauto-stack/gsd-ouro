#!/usr/bin/env node

/**
 * GSD Ouro — Error Knowledge Base (v0.5)
 * Catálogo de erros, similarity search, padrões e regras de prevenção.
 */

const fs = require('fs');
const path = require('path');

// ==================== UTILS ====================

function findOuroDir(startDir) {
  let dir = startDir || process.cwd();
  for (let i = 0; i < 20; i++) {
    const ouroPath = path.join(dir, '.ouro');
    if (fs.existsSync(ouroPath)) return ouroPath;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function writeJSON(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function ensureErrorsDir(ouroDir) {
  const errorsDir = path.join(ouroDir, 'errors');
  fs.mkdirSync(errorsDir, { recursive: true });
  const files = {
    'error-log.json': [],
    'patterns.json': [],
    'prevention.json': [],
  };
  for (const [name, defaultVal] of Object.entries(files)) {
    const fp = path.join(errorsDir, name);
    if (!fs.existsSync(fp)) writeJSON(fp, defaultVal);
  }
  return errorsDir;
}

// ==================== STORAGE ====================

function getErrorLog(ouroDir) {
  ensureErrorsDir(ouroDir);
  return readJSON(path.join(ouroDir, 'errors', 'error-log.json')) || [];
}

function getPatterns(ouroDir) {
  ensureErrorsDir(ouroDir);
  return readJSON(path.join(ouroDir, 'errors', 'patterns.json')) || [];
}

function getPreventionRules(ouroDir) {
  ensureErrorsDir(ouroDir);
  return readJSON(path.join(ouroDir, 'errors', 'prevention.json')) || [];
}

function saveErrorLog(ouroDir, log) {
  writeJSON(path.join(ouroDir, 'errors', 'error-log.json'), log);
}

function savePatterns(ouroDir, patterns) {
  writeJSON(path.join(ouroDir, 'errors', 'patterns.json'), patterns);
}

function savePreventionRules(ouroDir, rules) {
  writeJSON(path.join(ouroDir, 'errors', 'prevention.json'), rules);
}

// ==================== AUTO-DETECTION ====================

const CATEGORIA_KEYWORDS = {
  logic: ['TypeError', 'ReferenceError', 'Cannot read', 'undefined is not', 'is not a function', 'null', 'NaN'],
  runtime: ['RangeError', 'stack overflow', 'Maximum call', 'heap', 'memory', 'ENOMEM', 'timeout', 'SIGTERM'],
  syntax: ['SyntaxError', 'Unexpected token', 'unexpected end', 'missing', 'unterminated'],
  network: ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'fetch failed', 'network', '404', '500', '503', 'CORS'],
  dependency: ['MODULE_NOT_FOUND', 'Cannot find module', 'ENOENT', 'peer dep', 'version mismatch', 'not installed'],
  config: ['EACCES', 'EPERM', 'permission denied', 'invalid config', 'env', '.env', 'PORT in use', 'EADDRINUSE'],
};

function detectCategoria(message) {
  if (!message) return 'logic';
  const msg = message.toLowerCase();
  let best = 'logic';
  let bestCount = 0;
  for (const [cat, keywords] of Object.entries(CATEGORIA_KEYWORDS)) {
    const count = keywords.filter(kw => msg.includes(kw.toLowerCase())).length;
    if (count > bestCount) {
      bestCount = count;
      best = cat;
    }
  }
  return best;
}

function extractTagsFromMessage(message) {
  if (!message) return [];
  const tags = new Set();

  // Extract error type (e.g., TypeError, ReferenceError)
  const errorType = message.match(/^(\w+Error)/);
  if (errorType) tags.add(errorType[1]);

  // Extract quoted strings
  const quoted = message.match(/['"]([^'"]+)['"]/g);
  if (quoted) {
    quoted.forEach(q => tags.add(q.replace(/['"]/g, '')));
  }

  // Extract identifiers after common patterns
  const patterns = [
    /Cannot read propert(?:y|ies) of (\w+)/i,
    /(\w+) is not (?:a function|defined|an object)/i,
    /Cannot find module '([^']+)'/i,
    /Unexpected token (\S+)/i,
  ];
  for (const re of patterns) {
    const m = message.match(re);
    if (m) tags.add(m[1]);
  }

  // Common tech keywords
  const techKw = ['React', 'Node', 'Express', 'MongoDB', 'API', 'async', 'await', 'import', 'export', 'webpack', 'vite', 'npm', 'yarn'];
  for (const kw of techKw) {
    if (message.includes(kw)) tags.add(kw);
  }

  return [...tags].slice(0, 10);
}

function extractFilesFromStack(stack) {
  if (!stack) return [];
  const files = new Set();
  const re = /(?:at\s+.+?\s+\(|at\s+)([^():\s]+):(\d+)(?::(\d+))?\)?/g;
  let m;
  while ((m = re.exec(stack)) !== null) {
    let fp = m[1];
    // Skip node_modules and internal
    if (fp.includes('node_modules') || fp.startsWith('node:') || fp.startsWith('internal/')) continue;
    // Normalize path separators
    fp = fp.replace(/\\/g, '/');
    files.add(fp);
  }
  return [...files];
}

// ==================== SIMILARITY SCORING ====================

function tokenize(text) {
  if (!text) return [];
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);
}

function jaccard(setA, setB) {
  if (!setA.length && !setB.length) return 0;
  const a = new Set(setA);
  const b = new Set(setB);
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function similarityScore(errorEntry, query) {
  const queryTokens = tokenize(query);
  const queryCategoria = detectCategoria(query);
  const queryTags = extractTagsFromMessage(query);
  const queryFiles = extractFilesFromStack(query);

  // Message similarity: 30%
  const msgScore = jaccard(tokenize(errorEntry.message), queryTokens);

  // Stack similarity: 25%
  const stackFuncs = tokenize(errorEntry.stack);
  const queryFuncs = tokenize(query);
  const stackScore = jaccard(stackFuncs, queryFuncs);

  // Files similarity: 20%
  const entryFiles = errorEntry.arquivos || [];
  let fileScore = 0;
  if (queryFiles.length > 0 && entryFiles.length > 0) {
    // Exact match
    const exact = jaccard(entryFiles, queryFiles);
    // Partial match (filename only)
    const entryNames = entryFiles.map(f => path.basename(f));
    const queryNames = queryFiles.map(f => path.basename(f));
    const partial = jaccard(entryNames, queryNames);
    fileScore = exact * 0.7 + partial * 0.3;
  }

  // Categoria similarity: 15%
  const catScore = (errorEntry.categoria === queryCategoria) ? 1.0 : 0;

  // Tag similarity: 10%
  const tagScore = jaccard(errorEntry.tags || [], queryTags);

  return (
    msgScore * 0.30 +
    stackScore * 0.25 +
    fileScore * 0.20 +
    catScore * 0.15 +
    tagScore * 0.10
  );
}

// ==================== CORE FUNCTIONS ====================

function addError(ouroDir, data) {
  const log = getErrorLog(ouroDir);
  const id = 'err_' + String(log.length + 1).padStart(3, '0');

  const entry = {
    id,
    timestamp: new Date().toISOString(),
    message: data.message || '',
    stack: data.stack || '',
    categoria: data.categoria || detectCategoria(data.message),
    dificuldade: parseInt(data.dificuldade) || 3,
    solucao: data.solucao || '',
    arquivos: data.arquivos || extractFilesFromStack(data.stack),
    tags: data.tags || extractTagsFromMessage(data.message),
    status: data.solucao ? 'resolved' : 'new',
    pattern_id: null,
    resolucao_tempo_s: 0,
  };

  log.push(entry);
  saveErrorLog(ouroDir, log);

  // Try to extract patterns
  extractPattern(ouroDir);

  return entry;
}

function updateError(ouroDir, id, updates) {
  const log = getErrorLog(ouroDir);
  const idx = log.findIndex(e => e.id === id);
  if (idx === -1) return null;
  Object.assign(log[idx], updates);
  if (updates.solucao && log[idx].status === 'new') {
    log[idx].status = 'resolved';
  }
  saveErrorLog(ouroDir, log);
  return log[idx];
}

function searchSimilar(ouroDir, query, limit) {
  limit = limit || 3;
  const log = getErrorLog(ouroDir);
  if (!log.length) return [];

  const scored = log.map(entry => ({
    ...entry,
    similarity: Math.round(similarityScore(entry, query) * 100),
  }));

  return scored
    .filter(e => e.similarity > 10)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

// ==================== PATTERN EXTRACTION ====================

function normalizeMessage(msg) {
  if (!msg) return '';
  return msg
    .replace(/'[^']+'/g, "'X'")
    .replace(/"[^"]+"/g, '"X"')
    .replace(/\d+/g, 'N')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
}

function extractPattern(ouroDir) {
  const log = getErrorLog(ouroDir);
  const patterns = getPatterns(ouroDir);

  // Group by normalized message
  const groups = {};
  for (const entry of log) {
    const key = normalizeMessage(entry.message);
    if (!key) continue;
    if (!groups[key]) groups[key] = [];
    groups[key].push(entry);
  }

  let changed = false;
  for (const [key, entries] of Object.entries(groups)) {
    if (entries.length < 2) continue;

    // Check if pattern already exists
    let existing = patterns.find(p => p.regex_message === key);
    if (existing) {
      existing.ocorrencias = entries.length;
      existing.ultima_vez = new Date().toISOString().slice(0, 10);
      // Find best solution
      const resolved = entries.filter(e => e.solucao);
      if (resolved.length > 0) {
        existing.solucao_padrao = resolved[resolved.length - 1].solucao;
      }
    } else {
      const id = 'pat_' + String(patterns.length + 1).padStart(3, '0');
      const resolved = entries.filter(e => e.solucao);
      existing = {
        id,
        nome: entries[0].message.slice(0, 50),
        regex_message: key,
        categoria: entries[0].categoria,
        ocorrencias: entries.length,
        solucao_padrao: resolved.length > 0 ? resolved[resolved.length - 1].solucao : '',
        primeira_vez: entries[0].timestamp.slice(0, 10),
        ultima_vez: new Date().toISOString().slice(0, 10),
      };
      patterns.push(existing);
    }

    // Link entries to pattern
    for (const entry of entries) {
      if (!entry.pattern_id) {
        entry.pattern_id = existing.id;
        changed = true;
      }
    }
  }

  if (changed) saveErrorLog(ouroDir, log);
  savePatterns(ouroDir, patterns);
  return patterns;
}

// ==================== PREVENTION RULES ====================

function addPreventionRule(ouroDir, data) {
  const rules = getPreventionRules(ouroDir);
  const id = 'prev_' + String(rules.length + 1).padStart(3, '0');

  const rule = {
    id,
    trigger: data.trigger || '',
    regra: data.regra || '',
    severidade: data.severidade || 'medium',
    tags: data.tags || [],
    criado: new Date().toISOString().slice(0, 10),
    matches: 0,
    ultimo_match: null,
  };

  rules.push(rule);
  savePreventionRules(ouroDir, rules);
  return rule;
}

function checkPrevention(ouroDir, taskDescription) {
  if (!taskDescription) return [];
  const rules = getPreventionRules(ouroDir);
  const taskTokens = tokenize(taskDescription);
  const taskLower = taskDescription.toLowerCase();

  const matched = [];
  for (const rule of rules) {
    const triggerTokens = tokenize(rule.trigger);
    const triggerMatch = triggerTokens.some(t => taskLower.includes(t));
    const tagMatch = (rule.tags || []).some(t => taskLower.includes(t.toLowerCase()));

    if (triggerMatch || tagMatch) {
      // Update match count
      rule.matches = (rule.matches || 0) + 1;
      rule.ultimo_match = new Date().toISOString().slice(0, 10);
      matched.push(rule);
    }
  }

  if (matched.length > 0) {
    savePreventionRules(ouroDir, rules);
  }

  // Sort by severity
  const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return matched.sort((a, b) => (sevOrder[a.severidade] || 2) - (sevOrder[b.severidade] || 2));
}

function removePreventionRule(ouroDir, id) {
  const rules = getPreventionRules(ouroDir);
  const idx = rules.findIndex(r => r.id === id);
  if (idx === -1) return false;
  rules.splice(idx, 1);
  savePreventionRules(ouroDir, rules);
  return true;
}

// ==================== STATISTICS ====================

function getErrorStats(ouroDir) {
  const log = getErrorLog(ouroDir);
  const patterns = getPatterns(ouroDir);
  const rules = getPreventionRules(ouroDir);

  if (!log.length) {
    return {
      total: 0,
      by_category: {},
      by_difficulty: {},
      resolved: 0,
      resolved_pct: 0,
      avg_difficulty: 0,
      patterns_count: 0,
      prevention_rules: rules.length,
      top_patterns: [],
      recent: [],
    };
  }

  // By category
  const byCat = {};
  for (const e of log) {
    byCat[e.categoria] = (byCat[e.categoria] || 0) + 1;
  }

  // By difficulty
  const byDiff = {};
  for (const e of log) {
    const d = e.dificuldade || 3;
    byDiff[d] = (byDiff[d] || 0) + 1;
  }

  // Resolved
  const resolved = log.filter(e => e.status === 'resolved').length;

  // Average difficulty
  const avgDiff = log.reduce((s, e) => s + (e.dificuldade || 3), 0) / log.length;

  // Top patterns
  const topPat = patterns
    .sort((a, b) => b.ocorrencias - a.ocorrencias)
    .slice(0, 5)
    .map(p => ({ nome: p.nome, ocorrencias: p.ocorrencias, solucao: p.solucao_padrao }));

  // Recent errors
  const recent = log.slice(-10).reverse();

  return {
    total: log.length,
    by_category: byCat,
    by_difficulty: byDiff,
    resolved,
    resolved_pct: Math.round((resolved / log.length) * 100),
    avg_difficulty: Math.round(avgDiff * 10) / 10,
    patterns_count: patterns.length,
    prevention_rules: rules.length,
    top_patterns: topPat,
    recent,
  };
}

// ==================== EXPORTS ====================

module.exports = {
  // Utils
  findOuroDir,
  readJSON,
  writeJSON,
  ensureErrorsDir,
  // Auto-detection
  detectCategoria,
  extractTagsFromMessage,
  extractFilesFromStack,
  // Similarity
  tokenize,
  jaccard,
  similarityScore,
  // Core
  addError,
  updateError,
  searchSimilar,
  // Patterns
  normalizeMessage,
  extractPattern,
  // Prevention
  addPreventionRule,
  checkPrevention,
  getPreventionRules,
  removePreventionRule,
  // Storage
  getErrorLog,
  getPatterns,
  saveErrorLog,
  // Stats
  getErrorStats,
};

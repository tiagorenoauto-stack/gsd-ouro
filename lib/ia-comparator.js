#!/usr/bin/env node

/**
 * GSD Ouro — IA Comparator (v0.8)
 * Motor de comparação Multi-IA: envia mesmo prompt para N providers,
 * coleta respostas, mede latência/tokens, calcula score de qualidade,
 * e armazena histórico para análise de tendências.
 *
 * Uso:
 *   const comparator = require('./lib/ia-comparator');
 *   const result = await comparator.compare('meu prompt', ['deepseek:deepseek-chat', 'google:gemini-2.5-flash']);
 *   const ranking = comparator.getRanking();
 */

const fs = require('fs')
const path = require('path')
const providers = require('./ai-providers')

// ==================== CONSTANTS ====================

const HISTORY_DIR = () => path.join(process.cwd(), '.ouro', 'analytics', 'comparisons')
const RANKING_FILE = () => path.join(process.cwd(), '.ouro', 'analytics', 'ia-ranking.json')
const MAX_HISTORY = 100

// Score weights
const WEIGHTS = {
  relevance: 0.30,
  completeness: 0.25,
  clarity: 0.20,
  latency: 0.15,
  cost: 0.10
}

// ==================== SCORING ====================

/**
 * Calcula score de qualidade baseado em heurísticas.
 * Score 0-100, multi-critério.
 */
function scoreResponse(response, prompt, latency_ms, tokens) {
  const scores = {}

  // Relevance (0-100): resposta contém termos-chave do prompt?
  const promptWords = prompt.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  const responseWords = response.toLowerCase()
  const matchCount = promptWords.filter(w => responseWords.includes(w)).length
  scores.relevance = Math.min(100, Math.round((matchCount / Math.max(promptWords.length, 1)) * 100))

  // Completeness (0-100): tamanho relativo da resposta
  const responseLen = response.length
  if (responseLen < 50) scores.completeness = 20
  else if (responseLen < 200) scores.completeness = 50
  else if (responseLen < 500) scores.completeness = 70
  else if (responseLen < 1500) scores.completeness = 90
  else scores.completeness = 100

  // Clarity (0-100): estrutura (parágrafos, listas, headers)
  const hasStructure = /[\n]/.test(response)
  const hasList = /[-*•]\s|^\d+\./m.test(response)
  const hasCode = /```/.test(response)
  scores.clarity = 40
  if (hasStructure) scores.clarity += 20
  if (hasList) scores.clarity += 20
  if (hasCode) scores.clarity += 20

  // Latency (0-100): menor é melhor
  if (latency_ms < 500) scores.latency = 100
  else if (latency_ms < 1000) scores.latency = 90
  else if (latency_ms < 2000) scores.latency = 75
  else if (latency_ms < 5000) scores.latency = 50
  else if (latency_ms < 10000) scores.latency = 25
  else scores.latency = 10

  // Cost (0-100): menos tokens = melhor custo-benefício
  const totalTokens = (tokens?.input || 0) + (tokens?.output || 0)
  if (totalTokens < 200) scores.cost = 100
  else if (totalTokens < 500) scores.cost = 85
  else if (totalTokens < 1000) scores.cost = 70
  else if (totalTokens < 2000) scores.cost = 50
  else scores.cost = 30

  // Weighted total
  const total = Math.round(
    scores.relevance * WEIGHTS.relevance +
    scores.completeness * WEIGHTS.completeness +
    scores.clarity * WEIGHTS.clarity +
    scores.latency * WEIGHTS.latency +
    scores.cost * WEIGHTS.cost
  )

  return { total, breakdown: scores, weights: WEIGHTS }
}

// ==================== COMPARE ====================

/**
 * Compara o mesmo prompt em múltiplos providers em paralelo.
 *
 * @param {string} prompt - O prompt a enviar
 * @param {Array<string>} targets - Lista no formato 'provider:model' (ex: ['deepseek:deepseek-chat', 'google:gemini-2.5-flash'])
 * @param {object} [options]
 * @param {string} [options.system] - System prompt
 * @param {number} [options.max_tokens]
 * @param {number} [options.temperature]
 * @param {string} [options.category] - Categoria da comparação (codigo, debug, etc.)
 * @returns {object} { results: [...], winner, timestamp, prompt_preview }
 */
async function compare(prompt, targets, options = {}) {
  if (!targets || targets.length < 2) throw new Error('Mínimo 2 targets para comparar (formato: provider:model)')

  const parsed = targets.map(t => {
    const [provider, ...modelParts] = t.split(':')
    return { provider, model: modelParts.join(':') }
  })

  // Chamadas em paralelo
  const promises = parsed.map(async ({ provider, model }) => {
    const start = Date.now()
    try {
      const result = await providers.call(prompt, {
        ...options,
        provider,
        model,
        track: true
      })
      const score = scoreResponse(result.content, prompt, result.latency_ms, result.tokens)
      return {
        provider,
        model,
        content: result.content,
        latency_ms: result.latency_ms,
        tokens: result.tokens,
        score,
        status: 'ok'
      }
    } catch (err) {
      return {
        provider,
        model,
        content: null,
        latency_ms: Date.now() - start,
        tokens: { input: 0, output: 0 },
        score: { total: 0, breakdown: {}, weights: WEIGHTS },
        status: 'error',
        error: err.message
      }
    }
  })

  const results = await Promise.all(promises)

  // Ordenar por score (maior primeiro)
  results.sort((a, b) => b.score.total - a.score.total)

  const winner = results[0]?.status === 'ok' ? {
    provider: results[0].provider,
    model: results[0].model,
    score: results[0].score.total
  } : null

  const comparison = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    prompt_preview: prompt.slice(0, 120) + (prompt.length > 120 ? '...' : ''),
    prompt_length: prompt.length,
    category: options.category || detectCategory(prompt),
    targets: targets.length,
    results,
    winner
  }

  // Salvar no histórico
  saveComparison(comparison)
  updateRanking(results)

  return comparison
}

/**
 * Comparação rápida: 2 providers, retorna apenas o vencedor.
 */
async function quickCompare(prompt, target1, target2, options = {}) {
  const result = await compare(prompt, [target1, target2], options)
  return {
    winner: result.winner,
    scores: result.results.map(r => ({
      target: `${r.provider}:${r.model}`,
      score: r.score.total,
      latency: r.latency_ms
    }))
  }
}

// ==================== RANKING ====================

function loadRanking() {
  try {
    return JSON.parse(fs.readFileSync(RANKING_FILE(), 'utf-8'))
  } catch {
    return {}
  }
}

function saveRanking(ranking) {
  const dir = path.dirname(RANKING_FILE())
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(RANKING_FILE(), JSON.stringify(ranking, null, 2))
}

function updateRanking(results) {
  const ranking = loadRanking()

  for (const r of results) {
    if (r.status !== 'ok') continue
    const key = `${r.provider}:${r.model}`
    if (!ranking[key]) {
      ranking[key] = {
        provider: r.provider,
        model: r.model,
        comparisons: 0,
        wins: 0,
        total_score: 0,
        avg_score: 0,
        avg_latency: 0,
        total_latency: 0,
        categories: {}
      }
    }
    const entry = ranking[key]
    entry.comparisons++
    entry.total_score += r.score.total
    entry.avg_score = Math.round(entry.total_score / entry.comparisons)
    entry.total_latency += r.latency_ms
    entry.avg_latency = Math.round(entry.total_latency / entry.comparisons)

    // Category tracking
    const cat = r.category || 'geral'
    if (!entry.categories[cat]) entry.categories[cat] = { comparisons: 0, wins: 0, avg_score: 0, total_score: 0 }
    entry.categories[cat].comparisons++
    entry.categories[cat].total_score += r.score.total
    entry.categories[cat].avg_score = Math.round(entry.categories[cat].total_score / entry.categories[cat].comparisons)
  }

  // Mark winner
  if (results.length > 0 && results[0].status === 'ok') {
    const winnerKey = `${results[0].provider}:${results[0].model}`
    if (ranking[winnerKey]) {
      ranking[winnerKey].wins++
      const cat = results[0].category || 'geral'
      if (ranking[winnerKey].categories[cat]) ranking[winnerKey].categories[cat].wins++
    }
  }

  saveRanking(ranking)
}

/**
 * Retorna ranking global ordenado por avg_score.
 */
function getRanking(category) {
  const ranking = loadRanking()
  let entries = Object.values(ranking)

  if (category) {
    entries = entries.filter(e => e.categories[category])
    entries.forEach(e => {
      const cat = e.categories[category]
      e._filtered_score = cat.avg_score
      e._filtered_wins = cat.wins
      e._filtered_comparisons = cat.comparisons
    })
    entries.sort((a, b) => (b._filtered_score || 0) - (a._filtered_score || 0))
  } else {
    entries.sort((a, b) => b.avg_score - a.avg_score)
  }

  return entries.map((e, i) => ({
    rank: i + 1,
    provider: e.provider,
    model: e.model,
    avg_score: category ? e._filtered_score : e.avg_score,
    wins: category ? e._filtered_wins : e.wins,
    comparisons: category ? e._filtered_comparisons : e.comparisons,
    win_rate: +(((category ? e._filtered_wins : e.wins) / Math.max((category ? e._filtered_comparisons : e.comparisons), 1)) * 100).toFixed(1),
    avg_latency: e.avg_latency
  }))
}

// ==================== HISTORY ====================

function saveComparison(comparison) {
  const dir = HISTORY_DIR()
  fs.mkdirSync(dir, { recursive: true })

  // Save individual comparison
  const fileName = `${comparison.id}.json`
  fs.writeFileSync(path.join(dir, fileName), JSON.stringify(comparison, null, 2))

  // Maintain index
  const indexPath = path.join(dir, 'index.json')
  let index
  try {
    index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
  } catch {
    index = []
  }

  index.unshift({
    id: comparison.id,
    timestamp: comparison.timestamp,
    prompt_preview: comparison.prompt_preview,
    category: comparison.category,
    targets: comparison.targets,
    winner: comparison.winner
  })

  if (index.length > MAX_HISTORY) index = index.slice(0, MAX_HISTORY)
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2))
}

function getHistory(limit = 20) {
  const indexPath = path.join(HISTORY_DIR(), 'index.json')
  try {
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
    return index.slice(0, limit)
  } catch {
    return []
  }
}

function getComparison(id) {
  const filePath = path.join(HISTORY_DIR(), `${id}.json`)
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch {
    return null
  }
}

// ==================== RECOMMENDATIONS ====================

/**
 * Recomenda o melhor provider para uma categoria de tarefa.
 * Baseado no ranking histórico.
 */
function recommend(category) {
  const ranking = getRanking(category)
  if (!ranking.length) {
    return {
      recommendation: null,
      message: `Sem dados para categoria "${category || 'geral'}". Execute comparações primeiro.`
    }
  }

  const best = ranking[0]
  const runner = ranking[1]

  return {
    recommendation: `${best.provider}:${best.model}`,
    score: best.avg_score,
    win_rate: best.win_rate,
    comparisons: best.comparisons,
    runner_up: runner ? `${runner.provider}:${runner.model}` : null,
    runner_up_score: runner ? runner.avg_score : null,
    message: `Recomendo ${best.provider}:${best.model} (score ${best.avg_score}, win rate ${best.win_rate}%)`
  }
}

/**
 * Retorna presets de comparação por categoria.
 */
function getPresets() {
  return {
    codigo: [
      { provider: 'mistral', model: 'codestral-latest' },
      { provider: 'deepseek', model: 'deepseek-chat' }
    ],
    debug: [
      { provider: 'deepseek', model: 'deepseek-chat' },
      { provider: 'google', model: 'gemini-2.5-flash' }
    ],
    documentacao: [
      { provider: 'google', model: 'gemini-2.5-flash' },
      { provider: 'deepseek', model: 'deepseek-chat' }
    ],
    refactor: [
      { provider: 'mistral', model: 'codestral-latest' },
      { provider: 'deepseek', model: 'deepseek-chat' }
    ],
    rapido: [
      { provider: 'groq', model: 'llama-3.1-8b-instant' },
      { provider: 'mistral', model: 'codestral-latest' }
    ]
  }
}

// ==================== UTILS ====================

function generateId() {
  return 'cmp_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6)
}

function detectCategory(prompt) {
  const p = prompt.toLowerCase()
  if (/criar|implementar|componente|função|hook|api|endpoint|botão|form/.test(p)) return 'codigo'
  if (/bug|erro|fix|corrigir|crash|exception|debug/.test(p)) return 'debug'
  if (/refatorar|refactor|otimizar|melhorar|simplificar|performance/.test(p)) return 'refactor'
  if (/teste|test|spec|jest|mock|assert/.test(p)) return 'testes'
  if (/documentar|doc|readme|explicar|descrever/.test(p)) return 'documentacao'
  return 'geral'
}

/**
 * Estatísticas gerais do comparator.
 */
function getStats() {
  const history = getHistory(MAX_HISTORY)
  const ranking = loadRanking()

  const totalComparisons = history.length
  const categories = {}
  const winsByProvider = {}

  for (const entry of history) {
    const cat = entry.category || 'geral'
    categories[cat] = (categories[cat] || 0) + 1
    if (entry.winner) {
      const key = `${entry.winner.provider}:${entry.winner.model}`
      winsByProvider[key] = (winsByProvider[key] || 0) + 1
    }
  }

  return {
    total_comparisons: totalComparisons,
    providers_tracked: Object.keys(ranking).length,
    categories,
    top_winners: Object.entries(winsByProvider)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key, wins]) => ({ target: key, wins }))
  }
}

module.exports = {
  compare,
  quickCompare,
  getRanking,
  getHistory,
  getComparison,
  recommend,
  getPresets,
  getStats,
  scoreResponse
}

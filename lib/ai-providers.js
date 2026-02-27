#!/usr/bin/env node

/**
 * GSD Ouro — AI Providers (v3 — Multi-IA)
 * Genérico, leve, sem modelos hardcoded.
 * Providers e modelos vêm do config ou da skill que chama.
 *
 * v3: + Groq, + Ollama local, + métricas por chamada, + fallback chain, + rate limit
 */

const fs = require('fs')
const path = require('path')

// ==================== ENV ====================

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    const value = trimmed.slice(eqIndex + 1).trim()
    if (!process.env[key]) process.env[key] = value
  }
}

function getConfig() {
  const configPath = path.join(process.cwd(), '.ouro', 'config.json')
  if (!fs.existsSync(configPath)) return {}
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
}

function getModo() {
  return getConfig().modo || 'claude'
}

loadEnv()

// ==================== METRICS STORE ====================

const metricsPath = () => path.join(process.cwd(), '.ouro', 'analytics', 'ia-metrics.json')

function loadMetrics() {
  try {
    return JSON.parse(fs.readFileSync(metricsPath(), 'utf-8'))
  } catch {
    return { calls: [], providers: {} }
  }
}

function saveMetrics(metrics) {
  const dir = path.dirname(metricsPath())
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(metricsPath(), JSON.stringify(metrics, null, 2))
}

function recordMetric(result, prompt, success = true) {
  const metrics = loadMetrics()
  const entry = {
    timestamp: new Date().toISOString(),
    provider: result.provider,
    model: result.model,
    latency_ms: result.latency_ms,
    tokens_in: result.tokens?.input || 0,
    tokens_out: result.tokens?.output || 0,
    success,
    prompt_length: prompt.length
  }
  metrics.calls.push(entry)
  if (metrics.calls.length > 500) metrics.calls = metrics.calls.slice(-500)

  const key = `${result.provider}:${result.model}`
  if (!metrics.providers[key]) {
    metrics.providers[key] = { calls: 0, errors: 0, total_latency: 0, total_tokens_in: 0, total_tokens_out: 0 }
  }
  const p = metrics.providers[key]
  p.calls++
  if (!success) p.errors++
  p.total_latency += entry.latency_ms
  p.total_tokens_in += entry.tokens_in
  p.total_tokens_out += entry.tokens_out
  p.avg_latency = Math.round(p.total_latency / p.calls)
  p.error_rate = +(p.errors / p.calls * 100).toFixed(1)
  p.last_used = entry.timestamp

  saveMetrics(metrics)
  return entry
}

function getMetrics() {
  return loadMetrics()
}

function getProviderStats(provider, model) {
  const metrics = loadMetrics()
  const key = model ? `${provider}:${model}` : null
  if (key && metrics.providers[key]) return metrics.providers[key]
  if (!model) {
    const result = {}
    for (const [k, v] of Object.entries(metrics.providers)) {
      if (k.startsWith(provider + ':')) result[k] = v
    }
    return result
  }
  return null
}

// ==================== PROVIDERS ====================

// Chamada genérica OpenAI-compatible (Mistral, DeepSeek, Groq, etc.)
async function callOpenAI(prompt, options = {}) {
  const { endpoint, apiKey, model, system, max_tokens = 4096, temperature = 0.3 } = options
  if (!endpoint) throw new Error('endpoint obrigatório')
  if (!apiKey) throw new Error('API key não configurada')

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system || 'Você é um assistente de programação.' },
        { role: 'user', content: prompt }
      ],
      max_tokens,
      temperature
    })
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`${res.status}: ${err}`)
  }

  const data = await res.json()
  return {
    content: data.choices[0].message.content,
    tokens: {
      input: data.usage?.prompt_tokens || 0,
      output: data.usage?.completion_tokens || 0
    }
  }
}

// Chamada Google Gemini
async function callGemini(prompt, options = {}) {
  const { apiKey, model = 'gemini-2.5-flash', system, max_tokens = 4096, temperature = 0.3 } = options
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada')

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: max_tokens, temperature }
  }
  if (system) {
    body.systemInstruction = { parts: [{ text: system }] }
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini ${res.status}: ${err}`)
  }

  const data = await res.json()
  const usage = data.usageMetadata || {}
  return {
    content: data.candidates[0]?.content?.parts?.[0]?.text || '',
    tokens: {
      input: usage.promptTokenCount || 0,
      output: usage.candidatesTokenCount || 0
    }
  }
}

// Chamada Ollama local
async function callOllama(prompt, options = {}) {
  const { model = 'llama3', system, endpoint = 'http://localhost:11434/api/generate' } = options

  const body = { model, prompt, stream: false }
  if (system) body.system = system

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Ollama ${res.status}: ${err}`)
  }

  const data = await res.json()
  return {
    content: data.response || '',
    tokens: {
      input: data.prompt_eval_count || 0,
      output: data.eval_count || 0
    }
  }
}

// ==================== RATE LIMIT ====================

const rateLimits = {
  groq: { max_per_min: 30, window_ms: 60000 },
  google: { max_per_min: 15, window_ms: 60000 },
  mistral: { max_per_min: 30, window_ms: 60000 },
  deepseek: { max_per_min: 60, window_ms: 60000 },
  ollama: { max_per_min: 999, window_ms: 60000 }
}

const callTimestamps = {}

function checkRateLimit(provider) {
  const limit = rateLimits[provider]
  if (!limit) return true
  const now = Date.now()
  if (!callTimestamps[provider]) callTimestamps[provider] = []
  callTimestamps[provider] = callTimestamps[provider].filter(t => now - t < limit.window_ms)
  if (callTimestamps[provider].length >= limit.max_per_min) {
    const waitMs = limit.window_ms - (now - callTimestamps[provider][0])
    throw new Error(`Rate limit ${provider}: ${limit.max_per_min} req/min. Aguarde ${Math.ceil(waitMs / 1000)}s`)
  }
  callTimestamps[provider].push(now)
  return true
}

// ==================== FALLBACK CHAIN ====================

/**
 * Executa chamada com fallback chain automático.
 * @param {string} prompt
 * @param {Array<{provider: string, model: string}>} chain
 * @param {object} [options] - system, max_tokens, temperature
 */
async function callWithFallback(prompt, chain, options = {}) {
  if (!chain || !chain.length) throw new Error('fallback chain vazia')

  const errors = []
  for (let i = 0; i < chain.length; i++) {
    const { provider, model } = chain[i]
    try {
      const result = await call(prompt, { ...options, provider, model })
      result.fallback_used = i > 0
      result.attempts = i + 1
      result.chain = chain.map(c => `${c.provider}:${c.model}`)
      return result
    } catch (err) {
      errors.push({ provider, model, error: err.message })
    }
  }

  throw new Error(`Todos os providers falharam: ${JSON.stringify(errors)}`)
}

// ==================== API PÚBLICA ====================

/**
 * Chama um provider externo.
 *
 * @param {string} prompt
 * @param {object} options
 * @param {string} options.provider - 'mistral' | 'google' | 'deepseek' | 'groq' | 'ollama'
 * @param {string} options.model
 * @param {string} [options.system]
 * @param {number} [options.max_tokens]
 * @param {number} [options.temperature]
 * @param {boolean} [options.track] - Registrar métricas (default true)
 */
async function call(prompt, options = {}) {
  const { provider, model, track = true } = options
  if (!provider) throw new Error('provider obrigatório (mistral, google, deepseek, groq, ollama)')
  if (!model) throw new Error('model obrigatório')

  checkRateLimit(provider)

  const config = getConfig()
  const start = Date.now()
  let result

  if (provider === 'ollama') {
    const ollamaConf = config.provedores_externos?.ollama || {}
    result = await callOllama(prompt, {
      ...options,
      endpoint: ollamaConf.endpoint || 'http://localhost:11434/api/generate'
    })
  } else if (provider === 'google') {
    const apiKey = process.env[config.provedores_externos?.google?.env_key || 'GEMINI_API_KEY']
    if (!apiKey) throw new Error('GEMINI_API_KEY não configurada no .env')
    result = await callGemini(prompt, { ...options, apiKey })
  } else {
    const providerConfig = config.provedores_externos?.[provider]
    if (!providerConfig) throw new Error(`Provider "${provider}" não configurado em .ouro/config.json`)
    const apiKey = process.env[providerConfig.env_key]
    if (!apiKey) throw new Error(`${providerConfig.env_key} não configurada no .env`)
    result = await callOpenAI(prompt, {
      ...options,
      endpoint: providerConfig.endpoint,
      apiKey
    })
  }

  result.provider = provider
  result.model = model
  result.latency_ms = Date.now() - start

  if (track) recordMetric(result, prompt, true)

  return result
}

/**
 * Lista providers disponíveis (com key configurada).
 */
function listAvailable() {
  const config = getConfig()
  const providers = config.provedores_externos || {}
  const available = []

  for (const [name, conf] of Object.entries(providers)) {
    if (name === 'ollama') {
      available.push({ provider: name, status: 'local', models: conf.models || ['llama3'] })
      continue
    }
    const apiKey = process.env[conf.env_key]
    available.push({
      provider: name,
      status: apiKey ? 'ready' : 'no-key',
      env_key: conf.env_key
    })
  }

  return available
}

/**
 * Testa conexão com providers configurados.
 */
async function testAll() {
  const config = getConfig()
  const providers = config.provedores_externos || {}
  const results = {}

  const defaultModels = {
    mistral: 'codestral-latest',
    google: 'gemini-2.5-flash',
    deepseek: 'deepseek-chat',
    groq: 'llama-3.1-8b-instant',
    ollama: 'llama3'
  }

  for (const [name, providerConf] of Object.entries(providers)) {
    if (name === 'ollama') {
      try {
        const start = Date.now()
        await call('Responda apenas: OK', { provider: 'ollama', model: defaultModels.ollama, max_tokens: 10, track: false })
        results[name] = { status: 'ok', latency_ms: Date.now() - start }
      } catch (err) {
        results[name] = { status: 'offline', message: err.message }
      }
      continue
    }

    const apiKey = process.env[providerConf.env_key]
    if (!apiKey) {
      results[name] = { status: 'sem-key', message: `${providerConf.env_key} não encontrada` }
      continue
    }

    try {
      const start = Date.now()
      await call('Responda apenas: OK', {
        provider: name,
        model: defaultModels[name] || providerConf.default_model,
        max_tokens: name === 'google' ? 100 : 10,
        track: false
      })
      results[name] = { status: 'ok', latency_ms: Date.now() - start }
    } catch (err) {
      results[name] = { status: 'erro', message: err.message }
    }
  }

  return results
}

module.exports = {
  call,
  callWithFallback,
  testAll,
  listAvailable,
  getModo,
  getConfig,
  getMetrics,
  getProviderStats,
  checkRateLimit
}

#!/usr/bin/env node

/**
 * GSD Ouro — AI Providers (v2)
 * Genérico, leve, sem modelos hardcoded.
 * Providers e modelos vêm do config ou da skill que chama.
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

// ==================== PROVIDERS ====================

// Chamada genérica OpenAI-compatible (Mistral, DeepSeek, etc.)
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

// ==================== API PÚBLICA ====================

/**
 * Chama um provider externo.
 * A skill que chama decide qual provider e modelo usar.
 *
 * @param {string} prompt - Texto para enviar
 * @param {object} options
 * @param {string} options.provider - 'mistral' | 'google' | 'deepseek'
 * @param {string} options.model - Nome do modelo (ex: 'codestral-latest')
 * @param {string} [options.system] - System prompt
 * @param {number} [options.max_tokens] - Max tokens resposta
 * @param {number} [options.temperature] - Temperatura
 */
async function call(prompt, options = {}) {
  const { provider, model } = options
  if (!provider) throw new Error('provider obrigatório (mistral, google, deepseek)')
  if (!model) throw new Error('model obrigatório')

  const config = getConfig()
  const providerConfig = config.provedores_externos?.[provider]
  if (!providerConfig) throw new Error(`Provider "${provider}" não configurado em .ouro/config.json`)

  const apiKey = process.env[providerConfig.env_key]
  if (!apiKey) throw new Error(`${providerConfig.env_key} não configurada no .env`)

  const start = Date.now()
  let result

  if (provider === 'google') {
    result = await callGemini(prompt, { ...options, apiKey })
  } else {
    result = await callOpenAI(prompt, {
      ...options,
      endpoint: providerConfig.endpoint,
      apiKey
    })
  }

  result.provider = provider
  result.model = model
  result.latency_ms = Date.now() - start

  return result
}

/**
 * Testa conexão com providers configurados.
 * Detecta automaticamente quais têm key no .env.
 */
async function testAll() {
  const config = getConfig()
  const providers = config.provedores_externos || {}
  const results = {}

  const tests = {
    mistral: { model: 'codestral-latest' },
    google: { model: 'gemini-2.5-flash' },
    deepseek: { model: 'deepseek-chat' }
  }

  for (const [name, providerConf] of Object.entries(providers)) {
    const apiKey = process.env[providerConf.env_key]
    if (!apiKey) {
      results[name] = { status: 'sem-key', message: `${providerConf.env_key} não encontrada` }
      continue
    }

    const testConf = tests[name]
    if (!testConf) continue

    try {
      const start = Date.now()
      await call('Responda apenas: OK', {
        provider: name,
        model: testConf.model,
        max_tokens: name === 'google' ? 100 : 10
      })
      results[name] = { status: 'ok', latency_ms: Date.now() - start }
    } catch (err) {
      results[name] = { status: 'erro', message: err.message }
    }
  }

  return results
}

module.exports = { call, testAll, getModo, getConfig }

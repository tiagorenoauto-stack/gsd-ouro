#!/usr/bin/env node

/**
 * GSD Ouro — Testar conexão com provedores externos
 * Uso: node scripts/test-providers.js
 */

const { testAll, getModo } = require('../lib/ai-providers')

async function main() {
  console.log('╔══════════════════════════════════════╗')
  console.log('║  GSD Ouro — Teste de Provedores IA   ║')
  console.log('╚══════════════════════════════════════╝\n')

  const modo = getModo()
  console.log(`  Modo atual: ${modo}\n`)

  console.log('Testando conexões...\n')
  const results = await testAll()

  for (const [name, result] of Object.entries(results)) {
    const icons = { ok: '[OK]', erro: '[FALHA]', 'sem-key': '[SEM KEY]' }
    const icon = icons[result.status] || '[?]'
    const detail = result.status === 'ok'
      ? `${result.latency_ms}ms`
      : result.message
    console.log(`  ${icon} ${name.padEnd(15)} ${detail}`)
  }

  const total = Object.keys(results).length
  const ok = Object.values(results).filter(r => r.status === 'ok').length

  console.log(`\n  Resultado: ${ok}/${total} provedores conectados`)

  if (modo === 'claude') {
    console.log('\n  Modo "claude" ativo — providers externos são opcionais.')
    console.log('  Trocar para "economico" em .ouro/config.json para usá-los.')
  }
}

main().catch(err => {
  console.error('Erro:', err.message)
  process.exit(1)
})

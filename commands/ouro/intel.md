# /ouro:intel — Intelligence Engine (v0.5)

Quando o usuario digitar `/ouro:intel`, execute este fluxo:

## Comandos

### /ouro:intel (sem argumentos)
Mostrar health score + top 3 tips + resumo de erros.
Usar `lib/intelligence.js` → `getIntelligenceReport()`.

### /ouro:intel error "mensagem de erro"
1. Registrar o erro: `errorKB.addError(ouroDir, { message })`
2. Buscar erros similares: `errorKB.searchSimilar(ouroDir, message)`
3. Se match >= 70%: mostrar solucao encontrada
4. Se nao encontrar: pedir solucao e registrar com `updateError()`

### /ouro:intel tips [--categoria X]
Gerar dicas contextuais com `tipsEngine.generateTips(ouroDir)`.
Categorias: Performance, Quality, Organization, Prevention, Economy.

### /ouro:intel health
Mostrar health score detalhado com sub-scores:
- Velocidade (25%) — tarefas/sessao vs meta
- Qualidade (25%) — conformidade + prompt scores
- Estabilidade (20%) — taxa de erros resolvidos
- Consistencia (15%) — streak de dias ativos
- Organizacao (15%) — freshness dos MDs + regras

### /ouro:intel prevent "descricao da tarefa"
Verificar regras de prevencao antes de executar.
Mostrar warnings relevantes com severidade.

### /ouro:intel report
Relatorio completo: health + tips + erros + prevencao + tendencias.

## Integracao com Fluxo MATCH-DIFF-GENERATE-UPDATE

- **Antes de GENERATE**: `ouro-intel prevent check "descricao"` automaticamente
- **Se erro no GENERATE**: `ouro-intel error add "mensagem"` automaticamente
- **Apos resolver**: Atualizar erro com solucao
- **No UPDATE**: Verificar se novo erro cria padrao recorrente

## CLI Standalone

```bash
node bin/ouro-intel.js error add "TypeError: Cannot read..." --dificuldade 3 --solucao "..."
node bin/ouro-intel.js error similar "TypeError: Cannot read..."
node bin/ouro-intel.js error list
node bin/ouro-intel.js error stats
node bin/ouro-intel.js tips
node bin/ouro-intel.js health
node bin/ouro-intel.js prevent check "criar componente React"
node bin/ouro-intel.js prevent list
node bin/ouro-intel.js prevent add "trigger" --regra "..." --severidade high
node bin/ouro-intel.js report
```

## Dashboard

Tab "Inteligencia" em http://localhost:3333 com:
- Health Score (ring visual)
- KPIs: erros, prevencao, tips
- AI Insights (top tips)
- Distribuicao de erros (bar chart)
- Erros recentes (lista)
- Regras de prevencao (tabela)
- Tendencia de erros (sparkline)
- Sub-scores de saude (bars)

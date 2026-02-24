# /ouro:status — Dashboard Completo de Métricas

Quando o usuário digitar `/ouro:status`, leia os dados de `.ouro/analytics/dashboard.json` e exiba:

## Formato de Exibição

```
╔══════════════════════════════════════════════════════════╗
║  GSD OURO — STATUS                                       ║
║  Projeto: {nome}  |  Milestone: {milestone}              ║
╠══════════════════════════════════════════════════════════╣
║  📊 PROGRESSO: {percentual}% ({fases_ok}/{fases_total})  ║
║  💰 ECONOMIA: {economia_pct}% (${economia} economizados) ║
║  ⚡ VELOCIDADE: {tarefas_hora}/hora ({tendencia})        ║
║  ✅ QUALIDADE: {conformidade}% conforme Kit Ouro         ║
║  🤖 IAs: {chamadas} chamadas | {gratuitas_pct}% grátis  ║
╠══════════════════════════════════════════════════════════╣
║  ⚠️ ALERTAS: {alertas_ativos}                            ║
╚══════════════════════════════════════════════════════════╝
```

## Sub-comandos
- `/ouro:status --custo` — Detalhe de custos por IA e tarefa
- `/ouro:status --qualidade` — Desvios, bugs, conformidade
- `/ouro:status --ias` — Performance de cada IA
- `/ouro:status --tempo` — Análise de tempo e produtividade

## Dados Lidos De
- `.ouro/analytics/dashboard.json` — métricas agregadas
- `.ouro/ROADMAP.md` — progresso das fases
- `.ouro/STATE.md` — estado atual

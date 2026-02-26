# /ouro:status — Status Visual do Projeto

Quando o usuário digitar `/ouro:status`, gere um painel visual completo.

## Fontes de Dados

1. `.ouro/STATE.md` — fase atual, progresso, itens completados
2. `.ouro/analytics/dashboard.json` — métricas agregadas
3. `.ouro/ROADMAP.md` — fases e progresso
4. `.ouro/config.json` — modo atual (claude/economico)
5. `.ouro/PROJECT.md` — nome do projeto

## Formato Principal

Ler os dados e montar este painel (adaptar largura ao conteúdo real):

```
╔═══════════════════════════════════════════════════════╗
║  GSD OURO — {Projeto}                    ⚡ {modo}   ║
╠═══════════════════════════════════════════════════════╣
║                                                       ║
║  Fase: {numero} — {nome_fase}                         ║
║  Progresso: {barra} {pct}%                            ║
║  Sessão: #{numero} ({data})                           ║
║                                                       ║
╠═══════════════════════════════════════════════════════╣
║  CHECKLIST                                            ║
║  {✅/⏳/❌} {item_1}  {contagem}                      ║
║  {✅/⏳/❌} {item_2}  {contagem}                      ║
║  {✅/⏳/❌} {item_3}  {contagem}                      ║
║  ...                                                  ║
╠═══════════════════════════════════════════════════════╣
║  MÉTRICAS                                             ║
║  💰 Economia: {economia_pct}% (${economia})           ║
║  ✅ Qualidade: {conformidade}% conforme Kit            ║
║  📊 Tarefas: {concluidas}/{total}                     ║
║  🤖 IAs: {chamadas} chamadas | {gratis_pct}% grátis   ║
╠═══════════════════════════════════════════════════════╣
║  PRÓXIMO                                              ║
║  → {proxima_tarefa}                                   ║
║  Build: tsc {✅/❌}  vite {✅/❌}                     ║
╚═══════════════════════════════════════════════════════╝
```

## Barra de Progresso

Gerar a barra com caracteres Unicode:

- Proporção: 20 blocos total
- Preenchido: █ (U+2588)
- Vazio: ░ (U+2591)
- Exemplo 75%: `████████████████░░░░`

## Checklist

Extrair de STATE.md a seção de status/checklist (tabelas com Status ou itens com percentual).
Para cada item:
- 100% ou completo → ✅
- Parcial ou em andamento → ⏳
- 0% ou pendente → ❌

## Sub-comandos

- `/ouro:status --custo` — Detalhe de custos por IA e fase
- `/ouro:status --qualidade` — Desvios, conformidade, build
- `/ouro:status --ias` — Performance de cada provider
- `/ouro:status --mini` — Versão compacta (3 linhas) para usar inline

### Formato Mini (--mini)

```
⚡ {Projeto} | Fase {n}: {pct}% | ✅ {ok}/{total} | → {proxima}
```

Usar `--mini` automaticamente quando outra skill pede status antes de executar.

## Regras

1. Sempre ler STATE.md primeiro — é a fonte de verdade do estado atual
2. Se dashboard.json não existir, mostrar apenas dados do STATE.md
3. Não inventar dados — se não há métricas, mostrar "—"
4. Se o projeto tem itens específicos no STATE.md (como FormPageShell 16/16), usar esses

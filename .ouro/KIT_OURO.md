# Kit Padrao Ouro — GSD Ouro

> Fonte unica de verdade para componentes e padroes deste projeto.

## Componentes (lib/)

| Componente | Arquivo | Desde | Funcao |
| --- | --- | --- | --- |
| Prompt Generator | lib/prompt-generator.js | v0.4 | Motor CO-STAR, optimize, simulate, deep score, A/B |
| Trigger Engine | lib/trigger-engine.js | v0.6 | Auto-inject de padroes Kit no contexto |
| Intelligence | lib/intelligence.js | v0.5 | Health score, relatorio completo |
| Error KB | lib/error-kb.js | v0.5 | Base de erros, classificacao, prevencao |
| Tips Engine | lib/tips-engine.js | v0.5 | Dicas contextuais por fase |
| Chat Engine | lib/chat-engine.js | v0.7 | Linguagem natural → interpretacao → CO-STAR |
| Notes Engine | lib/notes-engine.js | v0.7 | Notas com auto-tag, auto-modulo, CRUD |
| Update Control | lib/update-control.js | v0.7 | Changelog, historico, version compare |
| AI Providers | lib/ai-providers.js | v0.6 | Providers externos v3 (Groq, Ollama, metricas, fallback) |
| IA Comparator | lib/ia-comparator.js | v0.8 | Compare paralelo, scoring, ranking, recomendacoes |
| Analytics | lib/analytics.js | v0.1 | Sessoes, tarefas, custos, metricas |

## Padroes de Codigo (kit/padroes/)

| # | Padrao | Arquivo | Trigger Keywords |
| --- | --- | --- | --- |
| 1 | Golden Model | golden-model.md | golden, modelo, referencia |
| 2 | 5 Layer Field Rule | 5-layer-field-rule.md | campo, field, validacao, 5 camadas |
| 3 | FastFill | fastfill.md | fastfill, preenchimento, rapido |
| 4 | Entity Linker | entity-linker.md | entidade, relacionamento, linker |
| 5 | Form Unificado | form-unificado.md | formulario, form, modal |
| 6 | Hierarquia 4 Niveis | hierarquia-4-niveis.md | hierarquia, modulo, grupo, unidade |
| 7 | Componentes Obrigatorios | componentes-obrigatorios.md | componente, obrigatorio, padrao |
| 8 | Naming Conventions | naming-conventions.md | nome, naming, convencao |
| 9 | Agentes Arquetipos | agentes-arquetipos.md | agente, arquiteto, auditor, debugger |
| 10 | Salvaguardas | salvaguardas.md | seguranca, salvaguarda, protecao |
| 11 | Git Standards | git-standards.md | git, commit, branch, merge |
| 12 | Checklists Qualidade | checklists-qualidade.md | checklist, qualidade, revisao |
| 13 | UI Standards | ui-standards.md | ui, visual, dark mode, cores |
| 14 | Error Patterns | error-patterns.md | erro, pattern, solucao |
| 15 | CONFIRM Before Code | confirm-before-code.md | confirm, autoriza, antes de codificar |

## Documentacao de Referencia

| Doc | Arquivo | Conteudo |
| --- | --- | --- |
| Mapa Arquitetural | kit/MAPA_GSD.md | Fluxo completo, componentes, versoes |
| Delegacao Multi-IA | kit/DELEGACAO_IA.md | 18 subtipos, matriz IA, rate limits, custos |
| Kit Ouro Master | kit/KIT_OURO.md | 16 padroes com refs e IA recomendada |

## Regras Imutaveis

1. MATCH no Kit antes de qualquer acao
2. CONFIRM obrigatorio antes de codificar
3. Modulos criticos (auth, pagamento, dados) = sempre Claude
4. Zero dependencias externas (npm)
5. Todo padrao novo deve ser registrado aqui

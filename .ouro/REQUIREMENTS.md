# Requisitos

## Core (v0.1-v0.4)

- [x] Estrutura .ouro/ com config, analytics, state
- [x] Skills via commands/ouro/*.md
- [x] Analytics engine (sessoes, tarefas, custos)
- [x] Dashboard web (metricas visuais, porta 3333)
- [x] Prompt Generator Pro (CO-STAR, RTF, CARE, deep score, simulate, A/B)
- [x] Modo guiado + reference materials

## Intelligence (v0.5-v0.6)

- [x] Error Knowledge Base (deteccao, classificacao, prevencao)
- [x] Tips Engine (dicas contextuais por fase)
- [x] Health Score (5 subdimensoes ponderadas)
- [x] Kit de 15 padroes documentados
- [x] Trigger Engine (auto-inject de padroes no contexto)
- [x] CONFIRM Before Code (obrigatorio antes de codificar)

## Interactive (v0.7)

- [x] Chat Engine (linguagem natural → interpretacao → prompt CO-STAR)
- [x] Notes Engine (auto-tag, auto-modulo, auto-prioridade, CRUD)
- [x] Update Control (changelog, historico, version compare)
- [x] Dashboard: tabs Chat, Notas, Updates

## Multi-IA (v0.8)

- [x] IA Comparator (compare paralelo, scoring 5 dimensoes, ranking, historico)
- [x] AI Providers v3 (+ Groq, + Ollama, metricas por chamada, fallback chain, rate limit)
- [x] Agentes Arquetipos com tabelas Multi-IA por agente
- [x] Dashboard: tab Comparacao (targets, presets, side-by-side, ranking)
- [x] 9 rotas API novas para comparacao e providers

## Auto-Update (v0.9 — Concluido)

- [x] Kit Sync engine (lib/kit-sync.js): registro, push, pull, diff, status
- [x] Registry global em ~/.gsd-ouro/ com hub de padroes
- [x] Versionamento cross-project por hash MD5
- [x] Deteccao de divergencias com diff detalhado
- [x] Dashboard: tab Sync (status, diff, acoes, projetos)
- [x] 8 rotas API (/api/sync/*)
- [x] 3 skill commands (sync-push, sync-pull, sync-status)

## Fora de Escopo

- Interface grafica desktop (so CLI + dashboard web)
- Autenticacao/multi-usuario (framework pessoal)
- Deploy em cloud (roda local)
- Dependencias npm (zero deps, tudo nativo Node.js)

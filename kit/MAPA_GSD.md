# MAPA GSD OURO — Arquitetura Completa v0.6

> Como o sistema funciona, de ponta a ponta.

## Visao Geral

```
USUARIO
    |
    v
CLAUDE.MD (instrucoes mestras — lido automaticamente)
    |
    v
SKILL (commands/ouro/*.md — define o fluxo)
    |
    +---> TRIGGER ENGINE (lib/trigger-engine.js)
    |         |
    |         v
    |     kit/triggers.json ---> kit/padroes/*.md
    |         |
    |         v
    |     Contexto injetado automaticamente no prompt
    |
    +---> PROMPT GENERATOR (lib/prompt-generator.js)
    |         |
    |         v
    |     CO-STAR + Tecnica + Formato + Triggers
    |
    +---> AI PROVIDERS (lib/ai-providers.js)
    |         |
    |         v
    |     Claude | Mistral | Gemini | DeepSeek | Groq
    |
    +---> ANALYTICS (lib/analytics.js)
    |         |
    |         v
    |     .ouro/analytics/*.json
    |
    +---> INTELLIGENCE (lib/intelligence.js)
              |
              v
          error-kb.js + tips-engine.js
              |
              v
          DASHBOARD (dashboard/index.html via dashboard-server.js)
```

## Fluxo de Dados Detalhado

### 1. Entrada do Usuario

```
/ouro:executar "criar pagina de relatorios"
         |
         v
commands/ouro/executar.md (skill lida pelo Claude)
         |
         v
Skill instrui: MATCH → DIFF → GENERATE → UPDATE
```

### 2. MATCH (Trigger Detection)

```
"criar pagina de relatorios"
         |
         v
lib/trigger-engine.js
  matchTriggers("criar pagina de relatorios", "executar")
         |
         v
Matches encontrados:
  1. golden-model    (P1, auto_inject: true)  ← "criar pagina"
  2. form-unificado  (P1, auto_inject: true)  ← "pagina"
  3. hierarquia      (P1, auto_inject: true)  ← "modulo" implicito
         |
         v
buildContextInjection(matches)
         |
         v
Contexto Kit Ouro injetado no prompt
```

### 3. GENERATE (Prompt + Execucao)

```
lib/prompt-generator.js
  generate(input, options)
         |
         v
CO-STAR montado:
  C = Contexto do projeto + Padroes Kit (via triggers)
  O = Objetivo da tarefa
  S = Estilo do codigo
  T = Tom (direto, sem explicacao)
  A = Audiencia (desenvolvedor)
  R = Resposta esperada (codigo + checklist)
         |
         v
Tecnica selecionada: CoT (complexidade media)
         |
         v
Formato: XML (Claude) ou Markdown (Gemini) ou JSON (GPT)
         |
         v
Prompt final gerado + verificacao com checklists dos triggers
```

### 4. UPDATE (Registro)

```
Codigo gerado
    |
    v
Verificar checklists (golden-model: 7 itens, form-unificado: 5 itens)
    |
    v
Se novo padrao criado → Adicionar ao KIT_OURO.md
    |
    v
Registrar em analytics:
  lib/analytics.js → .ouro/analytics/
    |
    v
Atualizar STATE.md
```

## Camadas do Sistema

### Camada 1: Instrucoes (lidas pelo Claude)

| Arquivo | Proposito | Tamanho |
|---------|----------|---------|
| CLAUDE.md | Instrucoes mestras, regras globais | ~80 linhas |
| kit/KIT_OURO.md | Referencia central de padroes (15 padroes) | ~250 linhas |
| kit/DELEGACAO_IA.md | Matriz de delegacao (18 subtipos) | ~150 linhas |
| kit/LOOP_EXECUCAO.md | MATCH→DIFF→GENERATE→UPDATE | ~30 linhas |
| kit/REGRAS.md | Regra de Ouro + hierarquia | ~35 linhas |
| kit/ECONOMIA_TOKENS.md | Tecnicas de economia | ~25 linhas |
| kit/MAPA_GSD.md | Este arquivo (arquitetura) | ~200 linhas |
| kit/padroes/*.md | 14 padroes detalhados | ~1.100 linhas total |
| commands/ouro/*.md | 11 skills com fluxos | ~500 linhas total |
| agents/*.md | 5 agentes especializados | ~250 linhas total |

### Camada 2: Logica (Node.js)

| Arquivo | Proposito | Estado |
|---------|----------|--------|
| lib/prompt-generator.js | Motor CO-STAR completo | Completo (700 linhas) |
| lib/trigger-engine.js | Deteccao de padroes por keywords | Completo (200 linhas) |
| lib/analytics.js | Tracking de metricas | Parcial |
| lib/ai-providers.js | Chamadas a providers externos | Completo (200 linhas) |
| lib/intelligence.js | Orquestrador: health + tips + errors | Completo (80 linhas) |
| lib/error-kb.js | Base de conhecimento de erros | Completo (60 linhas) |
| lib/tips-engine.js | Motor de dicas contextuais | Completo (60 linhas) |

### Camada 3: Dados (.ouro/)

| Arquivo | Proposito | Formato |
|---------|----------|---------|
| .ouro/config.json | Configuracao (modo, providers, triggers) | JSON |
| .ouro/PROJECT.md | Visao geral do projeto | MD template |
| .ouro/STATE.md | Estado atual da sessao | MD template |
| .ouro/ROADMAP.md | Fases e progresso | MD template |
| .ouro/KIT_OURO.md | Kit do projeto (por-projeto) | MD |
| .ouro/analytics/dashboard.json | Metricas agregadas | JSON |
| .ouro/analytics/sessoes/ | Historico de sessoes | JSON por sessao |
| .ouro/analytics/prompts/historico.json | Historico de prompts | JSON |
| .ouro/errors/*.json | Error KB + patterns + prevention | JSON |
| kit/triggers.json | Mapeamento keywords→padroes | JSON |

### Camada 4: Interface

| Arquivo | Proposito | Acesso |
|---------|----------|--------|
| dashboard/index.html | Dashboard web (11 tabs) | http://localhost:3333 |
| scripts/dashboard-server.js | Servidor HTTP | Port 3333 |
| scripts/status-live.js | Status no terminal | CLI |
| bin/ouro-prompt.js | CLI gerador de prompts | CLI |
| bin/ouro-track.js | CLI tracking de metricas | CLI |
| bin/ouro-intel.js | CLI inteligencia | CLI |

## CLIs Disponiveis

```bash
# Prompts
node bin/ouro-prompt.js generate "texto"         # Gerar prompt otimizado
node bin/ouro-prompt.js optimize "prompt fraco"   # Otimizar prompt existente
node bin/ouro-prompt.js verify "prompt"           # Verificar qualidade
node bin/ouro-prompt.js simulate "prompt"         # Simular eficacia por modelo
node bin/ouro-prompt.js compare "p1" "p2"         # Comparar 2 prompts
node bin/ouro-prompt.js stats                     # Metricas do historico
node bin/ouro-prompt.js top                       # Top prompts

# Inteligencia
node bin/ouro-intel.js health                     # Health score
node bin/ouro-intel.js tips                       # Dicas contextuais
node bin/ouro-intel.js error add "msg"            # Registrar erro
node bin/ouro-intel.js error similar "msg"        # Buscar similares
node bin/ouro-intel.js prevent check "tarefa"     # Verificar prevencao
node bin/ouro-intel.js report                     # Relatorio completo

# Tracking
node bin/ouro-track.js session start              # Iniciar sessao
node bin/ouro-track.js session end                # Encerrar sessao
node bin/ouro-track.js task "descricao"           # Registrar tarefa

# Dashboard
node scripts/dashboard-server.js                  # Iniciar dashboard web
node scripts/status-live.js                       # Status no terminal
node scripts/status-live.js --watch               # Status em tempo real
```

## Endpoints da API (Dashboard Server)

| Metodo | Rota | Funcao |
|--------|------|--------|
| GET | /api/dashboard | Metricas agregadas |
| GET | /api/sessoes | Historico de sessoes |
| GET | /api/fases | Progresso por fase |
| GET | /api/ias | Estatisticas de IAs |
| GET | /api/prompts | Historico de prompts |
| GET | /api/config | Configuracao atual |
| GET | /api/errors | Log de erros |
| GET | /api/errors/patterns | Padroes detectados |
| GET | /api/prevention | Regras de prevencao |
| GET | /api/tips | Dicas contextuais |
| GET | /api/health | Health score |
| GET | /api/intelligence | Relatorio completo |
| POST | /api/track/session | Registrar sessao |
| POST | /api/track/task | Registrar tarefa |
| POST | /api/track/error | Registrar erro |
| POST | /api/track/prevention | Adicionar regra |

## Skills Disponiveis (/ouro:*)

| Skill | Funcao | Implementacao |
|-------|--------|--------------|
| /ouro:help | Lista comandos | Completa |
| /ouro:novo-projeto | Inicializar projeto | Workflow |
| /ouro:planejar [fase] | Planejar fase | Workflow |
| /ouro:executar [fase] | Executar plano | Workflow |
| /ouro:verificar [fase] | Verificar conformidade | Workflow |
| /ouro:pausar | Salvar sessao | Workflow |
| /ouro:retomar | Carregar sessao | Workflow |
| /ouro:rapido "texto" | Tarefa ad-hoc | Workflow |
| /ouro:prompt "texto" | Gerar prompt otimizado | Completa |
| /ouro:intel | Inteligencia e metricas | Completa |
| /ouro:status | Dashboard visual | Completa |

## Versoes

| Versao | Codename | Foco |
|--------|----------|------|
| v0.1 | Foundation | Estrutura base, skills, analytics |
| v0.2 | Dashboard | Dashboard web, status-live |
| v0.3 | Guide | Guia completo, modo guiado |
| v0.4 | Prompt Pro | Gerador de prompts CO-STAR |
| v0.5 | Intelligence | Error KB, tips, health score |
| v0.6 | Smart Kit | 14 padroes, trigger engine, mapa |
| v0.7 | Interactive | Chat, notas, update control |
| v0.8 | Multi-IA | Comparacao de IAs, scores, fallback chain, ranking |
| v0.9 | Auto-Update | Propagacao entre projetos (planejado) |

# DELEGACAO DE TAREFAS — Matriz Expandida v0.6

## Principio

**Claude faz tudo por padrao** (ja pago no plano). Cada skill decide se precisa de IA externa.

## Modos de Operacao

| Modo | Comportamento | Quando usar |
|------|--------------|-------------|
| `claude` (padrao) | Tudo via Claude Code | Dia-a-dia normal |
| `economico` | Skills podem usar providers externos | Testes, experimentacao, volume alto |

Trocar modo: editar `modo` em `.ouro/config.json`

## Matriz de Delegacao (18 Subtipos)

### Codigo

| Subtipo | IA Primaria | Fallback | Custo | Latencia |
|---------|------------|----------|-------|----------|
| Boilerplate | Codestral | DeepSeek V3 | Gratis | 1-2s |
| Complexo | Claude Sonnet | DeepSeek R1 | Pago | 3-5s |
| Formulario | Claude Sonnet | Codestral | Pago | 2-4s |
| FastFill | Groq llama-3.1-8b | Cache local | Gratis | 300ms |

### Debug

| Subtipo | IA Primaria | Fallback | Custo | Latencia |
|---------|------------|----------|-------|----------|
| Simples | DeepSeek V3 | Claude Haiku | Gratis | 1-2s |
| Complexo | Claude Sonnet | DeepSeek R1 | Pago | 3-5s |
| Erro Conhecido | Error KB local | — | Gratis | 0s |

### Testes

| Subtipo | IA Primaria | Fallback | Custo | Latencia |
|---------|------------|----------|-------|----------|
| Unitarios | DeepSeek V3 | Codestral | Gratis | 1-3s |
| Integracao | Claude Sonnet | — | Pago | 3-5s |

### Documentacao

| Subtipo | IA Primaria | Fallback | Custo | Latencia |
|---------|------------|----------|-------|----------|
| Inline | Gemini Flash | DeepSeek V3 | Gratis | 1-2s |
| Completa | Gemini Pro | Claude Sonnet | Gratis | 2-4s |

### Refactoring

| Subtipo | IA Primaria | Fallback | Custo | Latencia |
|---------|------------|----------|-------|----------|
| Simples | Codestral | DeepSeek V3 | Gratis | 1-2s |
| Arquitetural | Claude Sonnet | — | Pago | 3-5s |

### Verificacao

| Subtipo | IA Primaria | Fallback | Custo | Latencia |
|---------|------------|----------|-------|----------|
| Conformidade | Claude Haiku | Error KB | Pago | 1-2s |
| Seguranca | Claude Sonnet | — | Pago | 3-5s |

### Outros

| Subtipo | IA Primaria | Fallback | Custo | Latencia |
|---------|------------|----------|-------|----------|
| Pesquisa | Gemini Pro | — | Gratis | 2-3s |
| Planejamento | Claude Sonnet | — | Pago | 3-5s |
| Otimizacao Prompt | Gemini/DeepSeek | Claude Haiku | Gratis | 1-2s |

## O Que NUNCA Delegar

Mesmo no modo economico, estes SEMPRE usam Claude:

- Autenticacao e autorizacao
- Processamento de pagamentos
- Manipulacao de dados pessoais
- Migrations de banco de dados
- Configuracoes de seguranca
- Verificacao de conformidade com Kit Ouro
- Decisoes de arquitetura

## Rate Limits (Free Tiers)

| Provider | Limite | Reset | Modelo Padrao |
|----------|--------|-------|--------------|
| Groq | 30 req/min, 15K tok/min | Por minuto | llama-3.1-8b-instant |
| Gemini | 15 req/min, 1M tok/dia | Por dia | gemini-2.5-flash |
| Codestral | 30 req/min | Por minuto | codestral-latest |
| DeepSeek | Sem limite publicado | — | deepseek-chat |

## Custo por Sessao Tipica

| Cenario | Modo Claude | Modo Economico | Economia |
|---------|-------------|----------------|----------|
| Simples (5 tarefas) | ~$0.15 | ~$0.03 | 80% |
| Media (15 tarefas) | ~$0.45 | ~$0.09 | 80% |
| Complexa (30 tarefas) | ~$1.20 | ~$0.30 | 75% |

## Como Funciona

1. **A skill define** qual provider e modelo usar — nao o orquestrador
2. **A skill verifica** o modo atual antes de chamar provider externo
3. Se modo = `claude`, a skill usa Claude normalmente
4. Se modo = `economico`, a skill pode chamar provider via `lib/ai-providers.js`

## Providers Externos Disponiveis

| Provider | Endpoint | Env Key | Uso |
|----------|----------|---------|-----|
| Mistral (Codestral) | api.mistral.ai | MISTRAL_API_KEY | Codigo, refactoring |
| Google (Gemini) | generativelanguage.googleapis.com | GEMINI_API_KEY | Contexto longo, docs |
| DeepSeek | api.deepseek.com | DEEPSEEK_API_KEY | Raciocinio, testes |
| Groq | api.groq.com | GROQ_API_KEY | FastFill, micro-tarefas |

## 5 Agentes Especializados

Ver detalhes: [kit/padroes/agentes-arquetipos.md](padroes/agentes-arquetipos.md)

| Agente | Quando | IA |
|--------|--------|---|
| Arquiteto | Modulo novo, decisao tecnica | Claude |
| Designer UI | Tela nova, visual, dark mode | Claude + Codestral |
| Auditor | Antes de commit, verificacao | Claude |
| Debugger | Erro inexplicavel | Claude |
| Scrum | Inicio/fim sessao | Claude ou DeepSeek |

## Regras

1. **Modo `claude` e o padrao** — zero complexidade
2. **Modo `economico` e opt-in** — ativar conscientemente
3. **Cada skill e autonoma** — sabe o que precisa
4. **Nenhum modelo hardcoded no orquestrador** — modelos ficam na skill ou config
5. **Modulos criticos** (auth, pagamento, dados) — sempre Claude, qualquer modo
6. **Trigger engine** detecta automaticamente o tipo de tarefa e sugere IA

# Framework CO-STAR — Base do Prompt Generator Pro

## Quando Usar
Framework padrão do GSD Ouro v0.4+. Todos os prompts gerados seguem esta estrutura.

## Estrutura

| Dimensão | Sigla | Descrição | Auto-preenchido? |
|----------|-------|-----------|------------------|
| **Context** | C | Contexto do projeto, estado atual, histórico | Sim (.ouro/) |
| **Objective** | O | Objetivo específico e mensurável | Não (input do usuário) |
| **Style** | S | Estilo de escrita/código | Sim (por tipo de tarefa) |
| **Tone** | T | Tom: técnico, didático, conciso | Sim (default por tipo) |
| **Audience** | A | Quem consome: dev, user, CI/CD | Sim (default: dev) |
| **Response** | R | Formato esperado: código, JSON, markdown | Sim (default por tipo) |

## Preenchimento Automático

### Context (C)
Extraído automaticamente de:
- `.ouro/PROJECT.md` → nome do projeto, stack, público
- `.ouro/STATE.md` → fase atual, última tarefa
- `.ouro/KIT_OURO.md` → componentes disponíveis
- `.ouro/active_context.md` → contexto da sessão

### Style (S) — Defaults por tipo
- **Código** → "Código limpo, modular, seguindo convenções do projeto"
- **Documentação** → "Documentação clara e bem estruturada"
- **Arquitetura** → "Análise técnica com prós e contras"

### Tone (T) — Defaults por tipo
- **Código/Testes** → Técnico e preciso
- **Debug/Arquitetura** → Analítico e investigativo
- **Documentação** → Didático e explicativo

### Response (R) — Defaults por tipo
- **Código/Debug/Testes/Refactor** → Código funcional
- **Documentação/Arquitetura** → Markdown estruturado

## Adaptação por Modelo

| Modelo | Formato CO-STAR |
|--------|----------------|
| Claude | XML tags (`<context>`, `<objective>`, etc.) + `<verify>` + `<constraints>` |
| GPT | JSON schema com campos estruturados |
| Gemini | Markdown com headers `## Contexto`, `# Tarefa` |
| DeepSeek | Formato conciso, só essenciais (Context, Task, Output) |
| Groq/Llama | Few-shot com exemplo + instruções detalhadas |

## Técnicas Automáticas

Seleção baseada na complexidade detectada:

| Complexidade | Técnica | Quando |
|-------------|---------|--------|
| Simples | Zero-shot | Bug fix, ajuste, novo campo |
| Média | Few-shot + CoT | Novo componente, refator |
| Alta | Tree-of-Thought | Decisão arquitetural, múltiplas abordagens |
| Crítica | Self-Consistency | Lógica financeira, segurança |

## Referências
- Pesquisa original: CO-STAR (recomendado), RISEN, CRISPE, RACE, RISE
- Ferramentas: DSPy (Stanford), Anthropic Console, PromptPerfect

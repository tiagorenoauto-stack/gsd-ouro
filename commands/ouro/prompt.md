# /ouro:prompt — Gerador de Prompts Pro (v0.4)

Quando o usuário digitar `/ouro:prompt "texto"`, execute este fluxo:

## Fluxo Principal (8 passos)

### 1. CAPTURA

Receba o texto do usuário em linguagem natural.

### 2. COLETA DE CONTEXTO (automático)

Leia e resuma:

- `.ouro/PROJECT.md` — nome, stack, público
- `.ouro/STATE.md` — fase atual, último trabalho
- `.ouro/KIT_OURO.md` — componentes disponíveis, padrões
- `.ouro/active_context.md` — contexto da sessão

### 3. CO-STAR (automático)

Montar estrutura CO-STAR a partir do contexto coletado:

| Dimensão | Fonte |
|----------|-------|
| **C** Context | Auto: PROJECT.md + STATE.md + active_context.md |
| **O** Objective | Input do usuário (passo 1) |
| **S** Style | Auto: por tipo de tarefa (código=limpo/modular, docs=claro/estruturado) |
| **T** Tone | Auto: por tipo (código=técnico, debug=analítico, docs=didático) |
| **A** Audience | Auto: "Desenvolvedor do projeto" (ou especificado via --audience) |
| **R** Response | Auto: por tipo (código=código funcional, docs=markdown) |

Referência: `prompt-engine/frameworks/costar-base.md`

### 4. TÉCNICA (automático)

Detectar complexidade e selecionar técnica:

| Complexidade | Técnica | Indicadores |
|-------------|---------|-------------|
| Simples | Zero-shot | bug fix, ajuste, campo novo |
| Média | Few-shot + CoT | componente, refator, hook |
| Alta | Tree-of-Thought | arquitetura, migração, design system |
| Crítica | Self-Consistency | segurança, auth, pagamento |

### 5. FORMATAÇÃO

Detectar modelo alvo e formatar o prompt:

| Modelo | Formato |
|--------|---------|
| Claude (padrão) | XML tags: `<context>`, `<objective>`, `<verify>`, `<constraints>` |
| GPT | JSON schema estruturado |
| Gemini | Markdown com headers |
| DeepSeek | Conciso: só Context, Task, Output |
| Groq/Llama | Few-shot com exemplo |

Motor: `lib/prompt-generator.js` → `formatForModel(costar, modelo)`

### 6. VERIFICAÇÃO (automático, a menos que --sem-verificar)

Self-reflection antes de apresentar. Checar:

1. Objetivo está claro e mensurável?
2. Contexto é suficiente?
3. Formato de saída está definido?
4. Há ambiguidades que podem gerar resultado errado?

Se encontrar problemas → aplicar correções automaticamente e informar.

### 7. PREVIEW

Mostrar prompt otimizado com:

- Decomposição CO-STAR (C, O, S, T, A, R)
- Tipo detectado + Técnica selecionada
- Score de qualidade (0-100)
- Tokens estimados
- Opções: [1] Aprovar [2] Editar [3] Regenerar [4] Cancelar

Se `--otimizar`: mostrar 3 variações rankeadas por score.

### 8. REGISTRO

```bash
node bin/ouro-track.js prompt --input "texto original" --tipo Codigo --tokens 500
```

Se score > 80: salvar automaticamente em `prompt-engine/library/top_prompts.json`.

## Flags

- `--rapido` — Pula preview, executa direto
- `--direto` — Sem otimização CO-STAR, envia texto como está
- `--preview` — Só mostra prompt, não executa
- `--comparar` — Gera 2-3 variações para comparar (alias de --otimizar)
- `--otimizar` — Gera 3 variações com frameworks/técnicas diferentes, rankeia por score
- `--modelo X` — Modelo alvo: claude, gpt, gemini, deepseek (default: claude)
- `--sem-verificar` — Desativa a auto-verificação (passo 6)

## CLI Standalone

Para uso fora do Claude Code:

```bash
node bin/ouro-prompt.js generate "texto" [--modelo claude] [--otimizar]
node bin/ouro-prompt.js verify "prompt"
node bin/ouro-prompt.js top [--tipo codigo]
node bin/ouro-prompt.js templates
```

## Templates Disponíveis

Em `prompt-engine/library/templates/`:
- `novo-componente.md` — Criar componentes
- `bug-fix.md` — Correção de bugs
- `refactor.md` — Refatoração
- `documentacao.md` — Documentação

Cada template tem CO-STAR pré-preenchido + técnica sugerida + checklist.

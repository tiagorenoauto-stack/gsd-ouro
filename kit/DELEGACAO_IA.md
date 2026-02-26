# DELEGAÇÃO DE TAREFAS — Modelo Skill-Driven

## Princípio

**Claude faz tudo por padrão** (já pago no plano). Cada skill decide se precisa de IA externa.

## Modos de Operação

| Modo              | Comportamento                        | Quando usar                          |
| ----------------- | ------------------------------------ | ------------------------------------ |
| `claude` (padrão) | Tudo via Claude Code                 | Dia-a-dia normal                     |
| `economico`       | Skills podem usar providers externos | Testes, experimentação, volume alto  |

Trocar modo: editar `modo` em `.ouro/config.json`

## Como Funciona

1. **A skill define** qual provider e modelo usar — não o orquestrador
2. **A skill verifica** o modo atual antes de chamar provider externo
3. Se modo = `claude`, a skill usa Claude normalmente
4. Se modo = `economico`, a skill pode chamar provider externo via `lib/ai-providers.js`

## Providers Externos Disponíveis

| Provider             | Uso principal            | Vantagem                |
| -------------------- | ------------------------ | ----------------------- |
| Mistral (Codestral)  | Código, refactoring      | Rápido, grátis          |
| Google (Gemini)      | Contexto longo, pesquisa | 1M tokens, grátis       |
| DeepSeek             | Raciocínio, testes       | Barato, forte em lógica |

## Skill de Consulta Externa

Sempre disponível, independente do modo. Para pedir segunda opinião:

```bash
/ouro:consultar-externa "pergunta ou código"
```

Útil para: comparar abordagens, contexto muito longo, opinião diferente.

## Regras

1. **Modo `claude` é o padrão** — zero complexidade
2. **Modo `economico` é opt-in** — ativar conscientemente
3. **Cada skill é autônoma** — sabe o que precisa
4. **Nenhum modelo hardcoded no orquestrador** — modelos ficam na skill ou no config
5. **Módulos críticos** (auth, pagamento, dados) — sempre Claude, qualquer modo

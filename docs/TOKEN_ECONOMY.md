# Economia de Tokens — Guia Completo

## Princípio Central

> **80% das tarefas de desenvolvimento são mecânicas e podem ser feitas por IAs gratuitas.**
> Claude fica reservado para os 20% que realmente precisam de inteligência premium.

## Estratégia de Delegação por Custo

### Nível 0 — GRÁTIS (Groq, Ollama)
- Boilerplate, CSS, tradução, formatação
- Via curl direto, sem SDK
- Economia: ~95% vs Claude

### Nível 1 — GRÁTIS (Codestral, Gemini, DeepSeek)
- Código simples/médio, documentação, testes, pesquisa
- Via API gratuita
- Economia: ~90% vs Claude

### Nível 2 — BARATO (Claude Haiku)
- Revisão de código, verificação rápida
- Economia: ~60% vs Sonnet

### Nível 3 — PREMIUM (Claude Sonnet/Opus)
- Arquitetura, debug complexo, decisões estratégicas
- Economia: 0% (necessário)

## Técnicas de Economia

| Técnica | Economia |
|---------|----------|
| XML tags (Claude) | 30-50% menos tokens |
| Referências ao Kit | Evita repetir conteúdo |
| Verify blocks | Evita 2-3x retrabalho |
| Batch de tarefas similares | 40-60% menos overhead |
| Cache de contexto na sessão | 20-30% menos repetição |
| Prompts otimizados | ~58% por tarefa |

## Meta

- **Custo por hora de desenvolvimento:** < $0.10
- **Percentual em IAs gratuitas:** > 80%
- **Taxa de sucesso 1ª tentativa:** > 85%

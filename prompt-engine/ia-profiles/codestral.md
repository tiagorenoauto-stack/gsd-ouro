# Perfil: Codestral

## Dados
- **Provider:** Mistral (via API gratuita)
- **Modelo:** codestral-latest
- **Custo:** $0 (free tier)
- **Contexto:** 32K tokens
- **Tier:** GRÁTIS

## Melhor Para
- Geração de código boilerplate
- Componentes React seguindo template
- Refactoring mecânico
- Completar código a partir de padrão

## Pior Para
- Lógica de negócio complexa
- CSS custom (tende a inventar classes)
- Código de autenticação/segurança

## Framework Preferido
RISE (rise-code.md)

## Desvios Conhecidos
- Tende a criar CSS custom → reforçar constraint "APENAS TailwindCSS"
- Às vezes ignora imports do Kit → listar imports explicitamente
- Naming inconsistente → incluir exemplo de naming no prompt

## Rate Limits
- 30 req/min
- Monitorar em analytics/

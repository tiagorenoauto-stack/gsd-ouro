# Biblioteca de Meta-Prompts

Esta pasta contém templates de meta-prompts aprovados e com alto score.

## Estrutura
Cada meta-prompt aprovado é salvo como JSON:

```json
{
  "id": "mp_001",
  "nome": "componente-react-kit-ouro",
  "tipo": "codigo",
  "framework": "xml-claude",
  "ia_destino": "codestral",
  "score": 92,
  "usos": 15,
  "sucesso_1a_tentativa": 87,
  "template": "...",
  "criado": "2026-02-24",
  "ultima_atualizacao": "2026-02-24"
}
```

## Auto-Otimização
Meta-prompts com score < 70 são sinalizados para revisão.
Meta-prompts com score > 90 são priorizados nas sugestões.

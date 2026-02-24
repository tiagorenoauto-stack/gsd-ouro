# Workflow: Gerador de Prompts

## Descrição
Transforma texto informal em prompt profissional otimizado.

## Trigger
`/ouro:prompt "texto"` ou via dashboard web

## Fluxo

```
INPUT (texto do usuário)
  │
  ├─ 1. COLETA DE CONTEXTO (automático)
  │   ├─ PROJECT.md → nome, stack, público
  │   ├─ STATE.md → fase, último trabalho
  │   ├─ KIT_OURO.md → componentes, padrões
  │   └─ active_context.md → sessão atual
  │
  ├─ 2. DETECÇÃO DE TIPO
  │   ├─ Código → framework RISE, IA: Codestral
  │   ├─ Documentação → framework Markdown, IA: Gemini
  │   ├─ Debug → framework XML, IA: Claude
  │   └─ Testes → framework RISE, IA: DeepSeek
  │
  ├─ 3. OTIMIZAÇÃO (IA gratuita)
  │   ├─ Montar meta-prompt com contexto + framework
  │   ├─ Enviar para Gemini/DeepSeek
  │   └─ Receber prompt otimizado
  │
  ├─ 4. PREVIEW (modo completo)
  │   ├─ Mostrar: IA usada, tokens, custo estimado
  │   └─ Opções: Aprovar / Editar / Regenerar / Cancelar
  │
  ├─ 5. EXECUÇÃO (se aprovado)
  │   └─ Enviar para IA destino
  │
  └─ 6. REGISTRO
      └─ Salvar em analytics/prompts/
```

## Modos
- `--rapido` → Pula preview (etapa 4)
- `--direto` → Pula otimização (etapas 2-3)
- `--preview` → Só mostra, não executa (para etapa 4)
- `--comparar` → Gera 2-3 variações

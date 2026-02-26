# Workflow: Gerador de Prompts

## Descrição

Transforma texto informal em prompt profissional otimizado.

## Trigger

`/ouro:prompt "texto"` ou via dashboard web

## Fluxo

```text
INPUT (texto do usuário)
  │
  ├─ 1. COLETA DE CONTEXTO (automático)
  │   ├─ PROJECT.md → nome, stack, público
  │   ├─ STATE.md → fase, último trabalho
  │   ├─ KIT_OURO.md → componentes, padrões
  │   └─ active_context.md → sessão atual
  │
  ├─ 2. DETECÇÃO DE TIPO
  │   ├─ Código → framework RISE
  │   ├─ Documentação → framework Markdown
  │   ├─ Debug → framework XML
  │   └─ Testes → framework RISE
  │
  ├─ 3. OTIMIZAÇÃO
  │   ├─ Modo claude: Claude otimiza o prompt
  │   └─ Modo econômico: skill pode usar provider externo
  │
  ├─ 4. PREVIEW (modo completo)
  │   ├─ Mostrar: prompt otimizado, tokens estimados
  │   └─ Opções: Aprovar / Editar / Regenerar / Cancelar
  │
  ├─ 5. EXECUÇÃO (se aprovado)
  │   └─ Executar prompt
  │
  └─ 6. REGISTRO
      └─ Salvar em analytics/prompts/
```

## Modos

- `--rapido` → Pula preview (etapa 4)
- `--direto` → Pula otimização (etapas 2-3)
- `--preview` → Só mostra, não executa (para etapa 4)
- `--comparar` → Gera 2-3 variações

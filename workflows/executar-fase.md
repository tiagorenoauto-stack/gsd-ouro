# Workflow: Execução de Fase

## Descrição
Orquestra a execução completa de uma fase do projeto.

## Trigger
`/ouro:executar [número_fase]`

## Fluxo

```
START
  │
  ├─ Ler PLAN.md da fase
  ├─ Verificar dependências
  │
  ├─ LOOP para cada tarefa:
  │   │
  │   ├─ Selecionar IA (via orchestrator)
  │   ├─ Montar prompt (via prompt-engine)
  │   ├─ Executar na IA selecionada
  │   │
  │   ├─ IF sucesso:
  │   │   ├─ Verificar conformidade (via reviewer)
  │   │   ├─ IF conforme → commit atômico ✅
  │   │   └─ IF desvio → corrigir → re-verificar
  │   │
  │   ├─ IF falha (1ª vez):
  │   │   └─ Tentar com prompt ajustado
  │   │
  │   ├─ IF falha (2ª vez):
  │   │   └─ Escalar para Claude Sonnet
  │   │
  │   ├─ IF falha (3ª vez):
  │   │   └─ PARAR e alertar usuário
  │   │
  │   └─ Registrar métricas
  │
  ├─ Gerar relatório da fase
  ├─ Atualizar STATE.md e ROADMAP.md
  └─ Mostrar resumo ao usuário
END
```

## Agentes Envolvidos
- **Orchestrator** — Seleciona IAs
- **Executor** — Monta e executa prompts
- **Reviewer** — Verifica conformidade

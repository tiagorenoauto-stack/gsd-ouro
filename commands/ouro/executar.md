# /ouro:executar — Executar Fase do Projeto

Quando o usuário digitar `/ouro:executar [número_fase]`:

## Workflow
1. Ler PLAN.md da fase
2. Para cada tarefa do plano:
   a. Selecionar IA conforme atribuição do plano
   b. Gerar prompt otimizado (via prompt-engine)
   c. Executar na IA selecionada
   d. Verificar resultado contra critérios
   e. Se OK → commit atômico + próxima tarefa
   f. Se falha → escalar para Claude Sonnet
3. Registrar métricas de cada tarefa em analytics/
4. Atualizar STATE.md com progresso

## Delegação de IAs
- Tarefas de código boilerplate → Codestral/DeepSeek (grátis)
- Tarefas de lógica complexa → Claude Sonnet
- Documentação → Gemini Pro (grátis)
- Testes → DeepSeek V3 (grátis)

## Registro
Cada tarefa executada gera entrada em analytics/sessoes/

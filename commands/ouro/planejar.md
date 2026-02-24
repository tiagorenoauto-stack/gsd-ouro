# /ouro:planejar — Planejar Fase do Projeto

Quando o usuário digitar `/ouro:planejar [número_fase]`:

## Workflow
1. Ler ROADMAP.md para entender o escopo da fase
2. Ler STATE.md para saber o estado atual
3. Ler KIT_OURO.md para conhecer padrões disponíveis
4. Decompor a fase em tarefas atômicas (máximo 30min cada)
5. Para cada tarefa, definir: IA responsável, prioridade, dependências
6. Gerar PLAN.md com o plano detalhado
7. Salvar em `.ouro/phases/fase-{N}/PLAN.md`
8. Atualizar STATE.md com status "planejada"

## IA Usada: Claude Sonnet (decisão estratégica)
Planejamento é tarefa crítica — sempre usa Claude.

## Saída Esperada
- Lista de tarefas numeradas
- IA atribuída a cada tarefa
- Estimativa de tokens/custo
- Critérios de verificação por tarefa

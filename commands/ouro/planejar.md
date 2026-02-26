# /ouro:planejar — Planejar Fase do Projeto

Quando o usuário digitar `/ouro:planejar [número_fase]`:

## Workflow
1. Garantir sessão ativa (se não houver, `node bin/ouro-track.js session start`)
2. Ler ROADMAP.md para entender o escopo da fase
3. Ler STATE.md para saber o estado atual
4. Ler KIT_OURO.md para conhecer padrões disponíveis
5. Decompor a fase em tarefas atômicas (máximo 30min cada)
6. Para cada tarefa, definir: IA responsável, prioridade, dependências
7. Gerar PLAN.md com o plano detalhado
8. Salvar em `.ouro/phases/fase-{N}/PLAN.md`
9. **Registrar fase no tracking:**
   ```bash
   node bin/ouro-track.js fase --numero N --nome "NomeFase" --status planned --tarefas-total X
   ```
10. Atualizar STATE.md com status "planejada"

## IA Usada: Claude Sonnet (decisão estratégica)
Planejamento é tarefa crítica — sempre usa Claude.

## Saída Esperada
- Lista de tarefas numeradas
- IA atribuída a cada tarefa
- Estimativa de tokens/custo
- Critérios de verificação por tarefa

# /ouro:executar — Executar Fase do Projeto

Quando o usuário digitar `/ouro:executar [número_fase]`:

## Workflow
1. Garantir sessão ativa (se não houver, `node bin/ouro-track.js session start`)
2. Ler PLAN.md da fase
3. Para cada tarefa do plano:
   a. Selecionar IA conforme atribuição do plano
   b. Gerar prompt otimizado (via prompt-engine)
   c. Executar na IA selecionada
   d. Verificar resultado contra critérios
   e. Se OK → commit atômico + próxima tarefa
   f. Se falha → escalar para Claude Sonnet
   g. **Registrar tarefa:**
      ```bash
      node bin/ouro-track.js task --nome "NomeTarefa" --ia codestral --tokens-in 500 --tokens-out 1200 --fase N --status ok
      ```
4. **Atualizar progresso da fase:**
   ```bash
   node bin/ouro-track.js fase --numero N --nome "NomeFase" --status current --progresso X --tarefas-total Y --tarefas-ok Z
   ```
5. Atualizar STATE.md com progresso

## Delegação de IAs
- Tarefas de código boilerplate → Codestral/DeepSeek (grátis)
- Tarefas de lógica complexa → Claude Sonnet
- Documentação → Gemini Pro (grátis)
- Testes → DeepSeek V3 (grátis)

## Custos Automáticos
Se `--custo` e `--custo-hip` não forem fornecidos, o tracker calcula automaticamente:
- Custo real = baseado na tabela de preços por IA (IAs grátis = $0)
- Custo hipotético = quanto custaria com Claude Sonnet pelos mesmos tokens

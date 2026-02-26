# /ouro:pausar — Salvar Contexto da Sessão

Quando o usuário digitar `/ouro:pausar`:

1. Capturar estado atual: fase, tarefa, último arquivo editado
2. Salvar em `.ouro/active_context.md` com timestamp
3. **Finalizar sessão de tracking:**
   ```bash
   node bin/ouro-track.js session end
   ```
4. Mostrar resumo com os dados retornados:
   ```
   Sessão Encerrada
   Duração: {duração}
   Tarefas: {concluídas}/{total}
   Custo: ${custo} (economia: {pct}%)
   ```

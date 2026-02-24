# /ouro:pausar — Salvar Contexto da Sessão

Quando o usuário digitar `/ouro:pausar`:
1. Capturar estado atual: fase, tarefa, último arquivo editado
2. Salvar em `.ouro/active_context.md` com timestamp
3. Registrar métricas da sessão em analytics/sessoes/
4. Mostrar resumo: "Sessão salva. Duração: Xh. Tarefas: N. Custo: $X"

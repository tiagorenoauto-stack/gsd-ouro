# /ouro:retomar — Carregar Contexto da Última Sessão

Quando o usuário digitar `/ouro:retomar`:

1. **Iniciar sessão de tracking:**
   ```bash
   node bin/ouro-track.js session start
   ```
2. Ler `.ouro/active_context.md`
3. Ler `.ouro/STATE.md`
4. Mostrar: última fase, última tarefa, tempo decorrido
5. Sugerir próximo passo baseado no estado
6. Perguntar: "Continuar de onde parou?"

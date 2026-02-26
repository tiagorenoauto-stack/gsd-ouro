# /ouro:rapido — Tarefa Ad-Hoc Sem Planejamento Completo

Quando `/ouro:rapido "descrição"`:

1. Garantir sessão ativa (se não houver, `node bin/ouro-track.js session start`)
2. Executar tarefa imediata sem workflow de fases
3. Usar prompt-engine para otimizar
4. **Registrar tarefa:**
   ```bash
   node bin/ouro-track.js task --nome "descrição curta" --ia nome-ia --tokens-in N --tokens-out N --status ok
   ```

Ideal para bug fixes, ajustes rápidos, perguntas pontuais.

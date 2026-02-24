# Hook: Fim de Sessão

> Executado quando o usuário digita `/ouro:pausar` ou encerra a sessão.

## Ações

1. **Salvar contexto**
   - Atualizar `.ouro/active_context.md` com estado atual
   - Atualizar `.ouro/STATE.md` com progresso

2. **Calcular métricas da sessão**
   - Duração, tarefas concluídas
   - Tokens consumidos, custo real
   - IAs utilizadas, taxa de sucesso
   - Conformidade com Kit Ouro

3. **Registrar sessão**
   - Salvar em `analytics/sessoes/{data}_{N}.json`
   - Atualizar `analytics/dashboard.json`

4. **Verificar Git**
   - Sugerir commit se há alterações pendentes
   - Mostrar resumo do que foi alterado

5. **Mostrar resumo**
   ```
   📊 Sessão Encerrada
   ⏱️  Duração: {duração}
   ✅ Tarefas: {concluídas}/{total}
   💰 Custo: ${custo} (economia: {pct}%)
   🤖 IAs: {lista com chamadas}
   ```

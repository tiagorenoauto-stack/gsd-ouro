# Hook: Início de Sessão

> Executado automaticamente quando o Claude Code abre o projeto.

## Ações

1. **Carregar contexto**
   - Ler `.ouro/active_context.md`
   - Ler `.ouro/STATE.md`
   - Ler `.ouro/ROADMAP.md` (resumo)

2. **Verificar estado do Git**
   - Branch atual
   - Alterações pendentes
   - Último commit

3. **Verificar rate limits**
   - Consultar providers gratuitos
   - Atualizar disponibilidade em analytics/

4. **Mostrar resumo**
   ```
   🏆 GSD Ouro — {Projeto}
   📍 Fase {N}: {nome} ({progresso}%)
   📋 Última sessão: {data} ({duração})
   💰 Economia acumulada: {valor}
   ⏭️  Próximo: {sugestão}
   ```

5. **Registrar início**
   - Criar entrada em analytics/sessoes/ com timestamp

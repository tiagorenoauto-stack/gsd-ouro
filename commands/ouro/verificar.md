# /ouro:verificar — Verificar Conformidade da Fase

Quando o usuário digitar `/ouro:verificar [número_fase]`:

## Workflow

1. Ler PLAN.md e critérios de verificação
2. Analisar código gerado contra KIT_OURO.md
3. Verificar: componentes usados, naming, espaçamento, imports
4. **Carregar triggers aplicáveis** (v0.6):
   ```javascript
   const te = require('./lib/trigger-engine');
   const matches = te.matchTriggers(descricaoDaTarefa, 'verificar');
   // Para cada match com checklist, verificar itens
   ```
5. Rodar testes se existirem
6. Gerar relatório com: OK / Desvios / Falhas + Triggers + Checklists
7. Se desvios encontrados → sugerir correções automáticas
8. **Registrar resultado da fase:**
   ```bash
   node bin/ouro-track.js fase --numero N --conformidade 95 --status done --progresso 100
   ```
9. Se 100% OK → marcar fase como concluída em ROADMAP.md

## IA Usada: Claude Sonnet/Haiku (verificação é tarefa de qualidade)

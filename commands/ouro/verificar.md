# /ouro:verificar — Verificar Conformidade da Fase

Quando o usuário digitar `/ouro:verificar [número_fase]`:

## Workflow
1. Ler PLAN.md e critérios de verificação
2. Analisar código gerado contra KIT_OURO.md
3. Verificar: componentes usados, naming, espaçamento, imports
4. Rodar testes se existirem
5. Gerar relatório com: OK / Desvios / Falhas
6. Se desvios encontrados → sugerir correções automáticas
7. **Registrar resultado da fase:**
   ```bash
   node bin/ouro-track.js fase --numero N --conformidade 95 --status done --progresso 100
   ```
8. Se 100% OK → marcar fase como concluída em ROADMAP.md

## IA Usada: Claude Sonnet/Haiku (verificação é tarefa de qualidade)

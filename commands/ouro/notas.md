# /ouro:notas — Bloco de Notas Inteligente

Quando o usuario digitar `/ouro:notas [acao] [texto]`:

## Acoes

- `/ouro:notas "texto"` — Criar nota (auto-tag, auto-modulo, auto-prioridade)
- `/ouro:notas listar` — Listar todas as notas (prioridade > data)
- `/ouro:notas listar --tag bug` — Filtrar por tag
- `/ouro:notas listar --modulo auth` — Filtrar por modulo
- `/ouro:notas feita [id]` — Marcar como concluida
- `/ouro:notas adiar [id]` — Marcar como adiada
- `/ouro:notas remover [id]` — Remover nota
- `/ouro:notas stats` — Estatisticas das notas

## Workflow

1. Receber texto do usuario
2. **Auto-detectar** via `lib/notes-engine.js`:
   ```javascript
   const notes = require('./lib/notes-engine');
   const nota = notes.addNote(texto);
   // nota.tags = ['feature', 'ui']
   // nota.module = 'header'
   // nota.priority = 'medium'
   ```
3. Apresentar resultado:
   ```
   Nota criada: [id]
   Tags: feature, ui
   Modulo: header
   Prioridade: media
   Sugestao: Considerar incluir na proxima fase do ROADMAP
   ```
4. Armazenar em `.ouro/notes/index.json`

## Tags Auto-Detectadas

bug, feature, ui, refactor, docs, performance, security, deploy, test, idea

## Prioridades

- **high** — urgente, critico, importante, bloqueia
- **medium** — depois, quando puder, seria bom (padrao)
- **low** — talvez, ideia, futuro, possivel

## IA Usada: Nao requer IA (deteccao por keywords)

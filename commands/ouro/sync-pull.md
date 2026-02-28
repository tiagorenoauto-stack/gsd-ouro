# /ouro:sync-pull — Importar Padroes do Hub

Quando o usuario digitar `/ouro:sync-pull`, importar padroes do hub central para o projeto.

## Execucao

```javascript
const sync = require('./lib/kit-sync')
const result = sync.pull({ force: false })
```

## Fluxo

1. Verificar se hub tem padroes → avisar se vazio
2. Comparar hub com local
3. Copiar novos (so no hub) para `kit/padroes/`
4. Atualizar inalterados
5. Reportar conflitos sem sobrescrever
6. Atualizar registry

## Formato de Saida

```
╔═══════════════════════════════════════════╗
║  SYNC PULL                                ║
╠═══════════════════════════════════════════╣
║  Importados: {count}                      ║
║  Novos: {count}                           ║
║  Conflitos: {count}                       ║
╠═══════════════════════════════════════════╣
║  {lista de arquivos importados}           ║
╚═══════════════════════════════════════════╝
```

## Opcoes

- `/ouro:sync-pull --force` — Sobrescrever conflitos locais
- `/ouro:sync-pull --include-kit` — Importar tambem o KIT_OURO.md
- `/ouro:sync-pull --files arquivo1.md` — Pull seletivo

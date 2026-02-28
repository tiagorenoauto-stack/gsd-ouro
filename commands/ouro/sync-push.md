# /ouro:sync-push — Exportar Padroes para Hub

Quando o usuario digitar `/ouro:sync-push`, exportar padroes locais para o hub central.

## Execucao

```javascript
const sync = require('./lib/kit-sync')

// Registrar se necessario
sync.register()

// Push
const result = sync.push({ force: false })
```

## Fluxo

1. Verificar se projeto esta registrado → registrar se nao
2. Escanear padroes locais em `kit/padroes/`
3. Comparar com hub (`~/.gsd-ouro/hub/padroes/`)
4. Copiar novos e inalterados
5. Reportar conflitos (hash diferente) sem sobrescrever
6. Atualizar meta do hub

## Formato de Saida

```
╔═══════════════════════════════════════════╗
║  SYNC PUSH                                ║
╠═══════════════════════════════════════════╣
║  Enviados: {count}                        ║
║  Conflitos: {count}                       ║
║  Ignorados: {count}                       ║
╠═══════════════════════════════════════════╣
║  {lista de arquivos enviados}             ║
╚═══════════════════════════════════════════╝
```

## Opcoes

- `/ouro:sync-push --force` — Sobrescrever conflitos no hub
- `/ouro:sync-push --files arquivo1.md,arquivo2.md` — Push seletivo

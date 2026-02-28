# /ouro:sync-status — Status do Kit Sync

Quando o usuario digitar `/ouro:sync-status`, mostrar status de sincronizacao cross-project.

## Fontes de Dados

1. `lib/kit-sync.js` — `status()` retorna tudo
2. `~/.gsd-ouro/registry.json` — projetos registrados
3. `~/.gsd-ouro/hub/` — padroes centralizados

## Execucao

```javascript
const sync = require('./lib/kit-sync')
const status = sync.status()
```

## Formato

```
╔═══════════════════════════════════════════════════════╗
║  KIT SYNC — Status                                    ║
╠═══════════════════════════════════════════════════════╣
║  Hub: {hub.patterns_count} padroes                    ║
║  Local: {current_project.patterns_count} padroes      ║
║  Projetos: {projects_registered} registrados          ║
╠═══════════════════════════════════════════════════════╣
║  DIFF                                                 ║
║  {ok} Em sync        {only_local} Somente local       ║
║  {only_hub} Somente hub  {modified} Divergentes       ║
╠═══════════════════════════════════════════════════════╣
║  PROJETOS                                             ║
║  {nome} — {path} — push: {data} — pull: {data}       ║
╚═══════════════════════════════════════════════════════╝
```

## Regras

- Se projeto nao esta registrado, avisar e sugerir `/ouro:sync-push`
- Se hub esta vazio, mostrar mensagem "Hub vazio — faca push primeiro"
- Listar divergencias com detalhes (hash local vs hub)

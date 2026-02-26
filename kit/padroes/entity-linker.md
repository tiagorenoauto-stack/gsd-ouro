# Entity Linker — Ligacao Cross-Modulo

## Quando Usar

- Relacionar entidades de modulos diferentes (ex: imovel ↔ contato)
- Criar referencias cruzadas entre registros
- Implementar tab de links em qualquer FormPage
- Integrar com FastFill (slots geram links automaticamente)

## Keywords de Trigger

`entity linker`, `linking`, `cross-module`, `relacionamento`, `referencia entre`, `vincular`, `associar`, `link entre`

## O Padrao

### Como Funciona

O EntityLinker e renderizado automaticamente pelo FormPageShell na tab `links`. Nao e necessario criar a tab manualmente.

```
FormPageShell
  └── Tab "Links" (automatica)
       └── EntityLinker
            ├── EntityLinkerRow (modulo A → modulo B)
            ├── EntityLinkerRow (modulo A → modulo C)
            └── + Adicionar Link
```

### API Obrigatoria

Para que o EntityLinker funcione, o controller do modulo DEVE ter um endpoint `@Get()` raiz que retorna:
```json
{ "data": [{ "id": 1, "name": "Nome do registro" }] }
```

**BUG-10:** Se este endpoint nao existir, EntityLinkerRow falha silenciosamente (sem erro visivel).

### Salvamento

Na submissao do form, os links sao sincronizados via:
```typescript
await entityLinksApi.syncLinks(entityType, savedId, validLinks);
```

Isso acontece no `afterSave` do FormPageShell automaticamente.

### Integracao com FastFill

Quando o FastFill detecta relacoes (Especialista 2):
- Slot 0 e Slot 1 criam links automaticamente
- O usuario confirma → link e adicionado ao EntityLinker
- Nenhuma acao manual necessaria

### Configuracao

```typescript
// No FormPageShellConfig
entityType: 'property',    // Tipo da entidade atual
moduleId: 'patrimonio',   // Modulo da entidade atual
// EntityLinker usa esses valores para buscar links compativeis
```

## Checklist

- [ ] Controller tem endpoint `@Get()` retornando `{ data: [{id, name}] }`
- [ ] `entityType` e `moduleId` definidos no FormPageShellConfig
- [ ] Nao criar tab de links manualmente (FormPageShell faz automaticamente)
- [ ] `entityLinksApi.syncLinks()` chamado no afterSave
- [ ] Testar: criar link, salvar, recarregar, verificar que link persiste

## IA Recomendada

- **Modo claude:** Claude para configuracao e integracao
- **Modo economico:** DeepSeek para endpoint boilerplate, Claude para configuracao

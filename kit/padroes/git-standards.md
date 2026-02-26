# Git Standards (Padrao de Commits e Branches)

## Quando Usar

- Criar qualquer commit
- Criar branches
- Fazer push
- Merge em main

## Keywords de Trigger

`commit`, `git`, `branch`, `merge`, `push`, `pull request`, `PR`

## O Padrao

### Formato de Commit

```
[MODULE] type: descricao curta

Corpo opcional com detalhes.
```

**Exemplos:**
```
[GSD-OURO] feat: trigger engine com 14 padroes AppVida
[APPVIDA] fix: whitelist DTO para campo phone_number
[PATRIMONIO] refactor: extrair mapPropertyData para arquivo separado
[DASHBOARD] style: dark mode nos cards de inteligencia
```

### Tipos Validos

| Tipo | Quando Usar | Exemplo |
|------|------------|---------|
| `feat` | Funcionalidade nova | Novo componente, nova rota |
| `fix` | Correcao de bug | Campo nao salva, layout quebrado |
| `refactor` | Reestruturacao sem mudar comportamento | Extrair funcao, renomear |
| `style` | Mudanca visual sem logica | Cores, spacing, dark mode |
| `docs` | Documentacao | README, KIT_OURO, comments |
| `chore` | Manutencao | Configs, deps, linting |
| `test` | Testes | Unit tests, e2e |
| `backup` | Snapshot antes de mudanca grande | Ponto de restauracao |
| `hotfix` | Correcao urgente em producao | Bug critico |

### Regras de Commit

1. **1 commit = 1 proposito** (nunca misturar feat + fix)
2. **Nunca misturar modulos** (cada commit e de 1 modulo)
3. **Descricao em portugues** (exceto termos tecnicos)
4. **Maximo 72 caracteres** na primeira linha
5. **Corpo opcional** para detalhes, separado por linha em branco

### Branches

```
tipo/descricao-curta
```

**Exemplos:**
```
feat/trigger-engine
fix/whitelist-dto
refactor/form-page-shell
```

### Regras de Branch

1. **main** = sempre funcional, nunca quebrada
2. Todo trabalho em branch separada
3. Merge SOMENTE apos build limpo + testes passando
4. Deletar branch apos merge

### Push

1. **NUNCA push com build quebrado**
2. Revisar commits antes de push (`git log --oneline`)
3. Descricao padronizada do que esta sendo enviado
4. Backup commit ANTES de trabalho grande

### Formato de Push Description

```
Push: [MODULE] vX.Y — Descricao do que muda

Commits incluidos:
- [MODULE] type: desc 1
- [MODULE] type: desc 2

Impacto: [lista de areas afetadas]
Build: OK
Testes: OK/N.A.
```

## Checklist

- [ ] Formato `[MODULE] type: desc` correto
- [ ] 1 commit = 1 proposito
- [ ] Build limpo antes do push
- [ ] Branch nomeada corretamente
- [ ] Descricao do push completa

## IA Recomendada

- **Qualquer modo:** Padroes de git sao universais, qualquer IA deve seguir

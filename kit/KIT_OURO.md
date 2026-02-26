# KIT PADRAO OURO — Referencia Central v0.6

> **Fonte unica de verdade para todos os componentes e padroes.**
> Toda IA que gera codigo DEVE consultar este arquivo primeiro.
> Regra de Ouro: MATCH → DIFF → CONFIRM → GENERATE → UPDATE

## Como Funciona

1. Antes de qualquer acao: **MATCH** neste arquivo
2. Se o padrao existe → **USE-O** (referencia ao kit/padroes/*.md)
3. Se nao existe → **PARE** e pergunte se deve criar
4. Apos criar padrao novo → **UPDATE** este arquivo

## Indice de Padroes (16)

| # | Padrao | Prioridade | Arquivo | Trigger Auto |
|---|--------|-----------|---------|-------------|
| 1 | Modelo Dourado | P1 | [golden-model.md](padroes/golden-model.md) | Sim |
| 2 | Regra dos 5 Campos | P1 | [5-layer-field-rule.md](padroes/5-layer-field-rule.md) | Sim |
| 3 | Formulario Unificado | P1 | [form-unificado.md](padroes/form-unificado.md) | Sim |
| 4 | Hierarquia 4 Niveis | P1 | [hierarquia-4-niveis.md](padroes/hierarquia-4-niveis.md) | Sim |
| 5 | Componentes Obrigatorios | P1 | [componentes-obrigatorios.md](padroes/componentes-obrigatorios.md) | Nao |
| 6 | Salvaguardas | P1 | [salvaguardas.md](padroes/salvaguardas.md) | Sim |
| 7 | Checklists de Qualidade | P1 | [checklists-qualidade.md](padroes/checklists-qualidade.md) | Sim |
| 8 | FastFill (IA Economica) | P2 | [fastfill.md](padroes/fastfill.md) | Nao |
| 9 | Entity Linker | P2 | [entity-linker.md](padroes/entity-linker.md) | Sim |
| 10 | Agentes Arquetipos | P2 | [agentes-arquetipos.md](padroes/agentes-arquetipos.md) | Nao |
| 11 | Git Standards | P2 | [git-standards.md](padroes/git-standards.md) | Nao |
| 12 | UI Standards | P2 | [ui-standards.md](padroes/ui-standards.md) | Nao |
| 13 | Naming Conventions | P3 | [naming-conventions.md](padroes/naming-conventions.md) | Nao |
| 14 | Error Patterns | P1 | [error-patterns.md](padroes/error-patterns.md) | Sim |
| 15 | Delegacao Multi-IA | — | [DELEGACAO_IA.md](DELEGACAO_IA.md) | — |
| 16 | CONFIRM Before Code | P0 | [confirm-before-code.md](padroes/confirm-before-code.md) | Sempre |

---

## 1. Modelo Dourado (Golden Model)

**FormPageShell** e o wrapper obrigatorio para TODOS os formularios.
- 10+ tabs com ordem padrao (Geral primeiro, Links/Categorias automaticos)
- `mapServerToForm` em arquivo separado (nunca inline)
- EntityLinker e CollapsibleCategories renderizados automaticamente

**Ref:** [kit/padroes/golden-model.md](padroes/golden-model.md)

## 2. Regra dos 5 Campos

**TODA** adicao de campo segue 5 camadas obrigatorias:
Entity → Migration → DTO → Schema → Form

**Bug critico prevenido:** Whitelist Silent Discard (campo salva mas dado some).

**Ref:** [kit/padroes/5-layer-field-rule.md](padroes/5-layer-field-rule.md)

## 3. Formulario Unificado

**Maximo 2 paginas** por modulo: ListPage + FormPage.
Nunca criar DetailPage separada. Visualizacoes extras = tabs.

**Ref:** [kit/padroes/form-unificado.md](padroes/form-unificado.md)

## 4. Hierarquia 4 Niveis

```
Modulo → Grupo → Unidade → Categoria
```

Nomenclatura **INEGOCIAVEL**: usar sempre estes termos exatos.
GroupIds semanticos em portugues: `imoveis`, `veiculos`, `contas`...

**Ref:** [kit/padroes/hierarquia-4-niveis.md](padroes/hierarquia-4-niveis.md)

## 5. Componentes Obrigatorios (12 + 3 IA)

12 componentes UI obrigatorios (FormPageShell, EntityLinker, FormTabBar, etc.)
3 componentes IA (useFormFiller, FormFillerNameInput, FormFillerSlots)
CSS: APENAS TailwindCSS com `dark:` em tudo

**Ref:** [kit/padroes/componentes-obrigatorios.md](padroes/componentes-obrigatorios.md)

## 6. Salvaguardas

5 verificacoes obrigatorias: Backup, Scope, Deps, Build antes, Build depois.
Arquivos proibidos: `.env`, `auth/`, `package.json`, migrations existentes.

**Ref:** [kit/padroes/salvaguardas.md](padroes/salvaguardas.md)

## 7. Checklists de Qualidade

5 checklists prontos: Campo Novo (6 itens), Componente Novo (10 itens), FormPage (7 itens), Pre-Commit (5 itens), Modulo Novo (8 itens).

**Ref:** [kit/padroes/checklists-qualidade.md](padroes/checklists-qualidade.md)

## 8. FastFill

2 micro-especialistas no Groq (llama-3.1-8b, 300ms, gratuito).
Parallel execution com Silent Slots (3 slots: modulo, destino, contato).

**Ref:** [kit/padroes/fastfill.md](padroes/fastfill.md)

## 9. Entity Linker

Ligacao cross-modulo automatica via FormPageShell.
Requer endpoint `@Get()` no controller retornando `{data: [{id,name}]}`.

**Ref:** [kit/padroes/entity-linker.md](padroes/entity-linker.md)

## 10. Agentes Arquetipos

5 especializacoes: Arquiteto, Designer UI, Auditor, Debugger (5 Porques), Scrum.
Cada agente tem prompt base e verificacoes pre-acao.

**Ref:** [kit/padroes/agentes-arquetipos.md](padroes/agentes-arquetipos.md)

## 11. Git Standards

Formato: `[MODULE] type: desc`. 1 commit = 1 proposito.
Tipos: feat, fix, refactor, style, docs, chore, test, backup, hotfix.
Nunca push com build quebrado.

**Ref:** [kit/padroes/git-standards.md](padroes/git-standards.md)

## 12. UI Standards

Paleta: primary (cyan), secondary (slate), success (green), error (red), accent IA (purple).
Gradientes por modulo. Botoes em 5 variantes. Tab bar pill-style.
Dark mode OBRIGATORIO em todos os elementos.

**Ref:** [kit/padroes/ui-standards.md](padroes/ui-standards.md)

## 13. Naming Conventions

| Contexto | Convencao |
|----------|-----------|
| DB colunas | snake_case |
| TS variaveis/funcoes | camelCase |
| React componentes | PascalCase |
| Hooks | use + camelCase |
| Modules | portugues lowercase |

**Ref:** [kit/padroes/naming-conventions.md](padroes/naming-conventions.md)

## 14. Error Patterns

7 bugs conhecidos documentados com causa, solucao e prevencao:
EP-01 Whitelist Silent, EP-02 Google 401, EP-03 Groq 429, EP-04 Dark Mode, EP-05 Object.assign, EP-06 EntityLinker Silent, EP-07 Migration Producao.

**Ref:** [kit/padroes/error-patterns.md](padroes/error-patterns.md)

## 16. CONFIRM Before Code (Obrigatorio)

**NUNCA** codificar sem apresentar bloco CONFIRM e receber autorizacao.
O bloco inclui: Interpretacao, Timing, Batching, Viabilidade, Opcoes, Riscos.
Priority 0 — sempre ativo em todos os contextos.

**Ref:** [kit/padroes/confirm-before-code.md](padroes/confirm-before-code.md)

## 15. Delegacao Multi-IA

18 subtipos de tarefa com IA primaria, fallback, custo e latencia.
Rate limits: Groq 30req/min, Gemini 15req/min, Codestral 30req/min.
Modulos criticos: SEMPRE Claude, qualquer modo.

**Ref:** [kit/DELEGACAO_IA.md](DELEGACAO_IA.md)

---

## Gatilhos Automaticos (Trigger Engine)

O arquivo `kit/triggers.json` mapeia keywords para padroes. O motor `lib/trigger-engine.js` detecta automaticamente quais padroes ativar baseado na descricao da tarefa.

**Exemplo:** Tarefa "criar pagina de relatorios" → ativa: golden-model + form-unificado

Triggers com `auto_inject: true` sao injetados no contexto do prompt automaticamente.

**Config:** `.ouro/config.json` → `triggers.enabled`, `triggers.auto_inject`, `triggers.max_patterns`

---

## Como Adicionar Novo Padrao

1. Criar arquivo em `kit/padroes/novo-padrao.md` com estrutura:
   - Quando Usar
   - Keywords de Trigger
   - O Padrao (conteudo tecnico)
   - Checklist
   - IA Recomendada

2. Adicionar trigger em `kit/triggers.json`

3. Se tem checklist, adicionar em `triggers.json` → `checklists`

4. Adicionar entrada neste arquivo (KIT_OURO.md) com resumo + referencia

5. Invalidar cache: `require('./lib/trigger-engine').invalidateCache()`

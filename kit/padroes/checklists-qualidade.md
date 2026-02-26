# Checklists de Qualidade

## Quando Usar

- Apos criar/modificar qualquer componente
- Apos adicionar campo novo (5 camadas)
- Antes de commit em branch principal
- Durante verificacao de fase (/ouro:verificar)

## Keywords de Trigger

`checklist`, `qualidade`, `verificacao`, `conformidade`, `auditoria`, `review`

## O Padrao

### Checklist 1: Campo Novo (5 Camadas)

Obrigatorio ao adicionar QUALQUER campo. Ver detalhes em `5-layer-field-rule.md`.

- [ ] **Entity:** `@Column` com tipo, name em snake_case, nullable definido
- [ ] **Migration:** `ALTER TABLE ADD COLUMN IF NOT EXISTS`, nunca synchronize
- [ ] **DTO:** `@IsOptional()` + decorator de tipo (`@IsString`, `@IsNumber`, etc.)
- [ ] **Schema:** Campo Zod com tipo e validacao (`z.string().optional()`)
- [ ] **Form:** Componente UI correto, label em portugues, validacao visual
- [ ] **Teste:** Salvar → recarregar → dado persiste

### Checklist 2: Componente Novo (10 Itens)

Obrigatorio ao criar qualquer componente visual.

- [ ] **Cores** seguem paleta padrao (ver `ui-standards.md`)
- [ ] **Botoes** usam variantes padrao (primary, secondary, outline, danger, ghost)
- [ ] **Icones** seguem tamanhos padrao (sm=16, md=20, lg=24)
- [ ] **Formularios** seguem estrutura padrao (FormPageShell + tabs)
- [ ] **Modais** seguem layout padrao (titulo, corpo, acoes)
- [ ] **Mensagens** em portugues (labels, placeholders, erros, toasts)
- [ ] **Batch actions** seguem ordem padrao (select, action, confirm)
- [ ] **Responsividade** testada em mobile (< 600px)
- [ ] **Loading states** implementados (skeleton, spinner)
- [ ] **Feedbacks** via toasts (sucesso verde, erro vermelho, info azul)

### Checklist 3: FormPage Completo (7 Itens)

Obrigatorio para cada FormPage do projeto.

- [ ] **FormPageShell** como wrapper (nunca form solto)
- [ ] **FormTabBar** pill-style (nunca underline)
- [ ] **mapServerToForm** em arquivo separado
- [ ] **EntityLinker** configurado (automatico via Shell)
- [ ] **CollapsibleCategories** configurado (automatico via Shell)
- [ ] **Schema Zod** para validacao completa
- [ ] **Maximo 2 paginas** no modulo (List + Form)

### Checklist 4: Antes de Commit (5 Itens)

Obrigatorio antes de QUALQUER commit em branch principal.

- [ ] **Build limpo:** `tsc` sem erros
- [ ] **Imports:** Nenhum import nao utilizado
- [ ] **Console:** Nenhum `console.log` esquecido
- [ ] **Dark mode:** Todas as classes com `dark:` variante
- [ ] **Naming:** Convencoes de nomenclatura respeitadas

### Checklist 5: Modulo Novo (8 Itens)

Obrigatorio ao criar um modulo inteiro.

- [ ] **Hierarquia** de 4 niveis definida
- [ ] **GroupIds** semanticos em portugues
- [ ] **ListPage** com busca, filtros, batch actions
- [ ] **FormPage** com FormPageShell + tabs ordenadas
- [ ] **EntityLinker** configurado
- [ ] **FastFill** integrado (useFormFiller)
- [ ] **Rotas** no padrao: /module, /module/new, /module/:id
- [ ] **Schemas** Zod para todos os formularios

## Como Usar nos Triggers

Cada checklist tem um ID usado em `kit/triggers.json`:
- `5-layer-field` → Checklist 1
- `componentes-10` → Checklist 2
- `golden-model` → Checklist 3
- `salvaguardas` → Checklist 4
- `modulo-novo` → Checklist 5

## IA Recomendada

- **Modo claude:** Claude executa e verifica todos os checklists
- **Modo economico:** Claude para verificacao (SEMPRE), DeepSeek para correcoes

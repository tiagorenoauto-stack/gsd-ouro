# Modelo Dourado (Golden Model)

## Quando Usar

- Criar nova pagina de formulario em qualquer modulo
- Replicar estrutura de PropertyFormPage para outro modulo
- Adicionar tabs ou reorganizar formulario existente

## Keywords de Trigger

`criar pagina`, `novo formulario`, `FormPage`, `replicar modelo`, `FormPageShell`, `novo modulo`, `pagina de cadastro`

## O Padrao

### FormPageShell

Componente wrapper obrigatorio para TODOS os formularios. Gerencia:
- Tabs (FormTabBar) com navegacao pill-style
- Estado do formulario (dirty/pristine/saving)
- Salvamento (save/cancel) com ActionBar sticky
- Entity linking automatico (via EntityLinker na tab links)
- Breadcrumb automatico baseado na rota
- Categorias automaticas (via CollapsibleCategories na tab categorias)

### FormPageShellConfig (Interface Completa)

```typescript
interface FormPageShellConfig {
  entityType: string;                // 'property', 'vehicle', 'account'
  apiPath: string | ((id) => string); // '/properties' ou funcao para rotas nested
  moduleId: string;                  // 'patrimonio', 'financeiro', 'contatos'
  groupId: string;                   // 'imoveis', 'veiculos', 'contas'
  breadcrumb: Array | ((entity) => Array);
  backUrl: string | ((entity) => string);
  title: { new: string, edit: string | ((entity) => string) };
  subtitle: { new: string, edit: string | ((entity) => string) };
  tabs: FormTab[];                   // Array de tabs com id, label, component
  defaultTab: string;                // Tab ativa por padrao
  editOnlyTabs?: string[];           // Tabs ocultas no modo 'new'
  resolver: zodResolver;             // Schema Zod do formulario
  mapServerToForm: (data) => object; // Transformacao server -> form
  transformBeforeSubmit?: (data) => object;
  afterSave?: (savedData) => void;
  customActions?: (entity) => ReactNode;
  onDelete?: (entity) => void;
  updateMethod: 'patch' | 'put';     // Metodo HTTP para update
  nameField?: string;                // Campo usado como titulo
  notesField?: string;               // Campo de observacoes
}
```

### Tabs Standard (Ordem Recomendada)

1. Identificacao (dados basicos: nome, tipo, status)
2. Endereco (localizacao, mapa)
3. Financeiro (valores, custos, receitas)
4. Caracteristicas (campos especificos do modulo)
5-8. [Tabs especificas do modulo]
9. Documentos (uploads via DocumentManager)
10. Fotos (uploads via PhotoManager + PhotoCarousel)
11. Links (automatico via EntityLinker — renderizado pelo FormPageShell)
12. Categorias (automatico via CollapsibleCategories — renderizado pelo FormPageShell)

**IMPORTANTE:** FormPageShell renderiza automaticamente as tabs `links` e `categorias`. O FormPage NAO deve renderiza-las.

### mapServerToForm — Regras de Transformacao

| Tipo Server | Transformacao | Exemplo |
|-------------|--------------|---------|
| decimal | `Number(value)` | `Number(data.purchase_price)` |
| JSONB array | `parseJsonArray(value)` | `parseJsonArray(data.features)` |
| date | Strip timezone: `value?.split('T')[0]` | `data.due_date?.split('T')[0]` |
| string nullable | Fallback string vazia | `data.name ?? ''` |
| boolean nullable | Nullish coalescing | `data.is_active ?? false` |
| JSONB object | Map com UUID fallback | `items.map(i => ({...i, _id: i._id ?? uuid()}))` |

**Arquivo separado:** Sempre criar `map{Entity}Data.ts` (ex: `mapPropertyData.ts`). Nunca inline no FormPage.

## Checklist

- [ ] FormPageShell como wrapper (NUNCA criar form sem ele)
- [ ] Tabs ordenadas (Identificacao primeiro, Links/Categorias automaticos)
- [ ] mapServerToForm em arquivo separado
- [ ] EntityLinker configurado com entityType e moduleId
- [ ] useFormFiller integrado (se modulo suporta FastFill)
- [ ] Schema Zod para validacao de todos os campos
- [ ] Max 2 paginas no modulo (ListPage + FormPage)
- [ ] FormTabBar pill-style (NUNCA underline)
- [ ] ActionBar sticky no topo

## IA Recomendada

- **Modo claude:** Claude faz tudo (estrutura + campos + transformacoes)
- **Modo economico:** Claude para estrutura e config, DeepSeek para campos boilerplate e mapServerToForm

## Exemplo de Uso

```typescript
// PropertyFormPage.tsx (simplificado)
const config: FormPageShellConfig = {
  entityType: 'property',
  apiPath: '/properties',
  moduleId: 'patrimonio',
  groupId: 'imoveis',
  tabs: [
    { id: 'geral', label: 'Geral', component: GeralTab },
    { id: 'endereco', label: 'Endereco', component: EnderecoTab },
    { id: 'financeiro', label: 'Financeiro', component: FinanceiroTab },
    { id: 'docs', label: 'Documentos', component: DocsTab },
    { id: 'fotos', label: 'Fotos', component: FotosTab },
  ],
  defaultTab: 'geral',
  editOnlyTabs: ['docs', 'fotos'],
  resolver: zodResolver(propertySchema),
  mapServerToForm: mapPropertyData,
  updateMethod: 'patch',
};

export default function PropertyFormPage() {
  return <FormPageShell config={config} />;
}
```

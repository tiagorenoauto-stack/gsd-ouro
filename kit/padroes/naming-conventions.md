# Convencoes de Nomenclatura

## Quando Usar

- Criar qualquer arquivo, variavel, componente ou tabela nova
- Renomear elementos existentes
- Verificar conformidade de nomenclatura
- Configurar linter ou formatter

## Keywords de Trigger

`nome`, `naming`, `convencao`, `snake_case`, `camelCase`, `PascalCase`, `renomear`, `nome arquivo`

## O Padrao

### Por Contexto

| Contexto | Convencao | Exemplo |
|----------|-----------|---------|
| Database (colunas) | snake_case | `purchase_price`, `rental_status`, `fixed_expenses` |
| Database (tabelas) | snake_case plural | `properties`, `vehicle_documents`, `entity_links` |
| TypeScript (variaveis) | camelCase | `purchasePrice`, `rentalStatus`, `isActive` |
| TypeScript (funcoes) | camelCase | `mapPropertyData`, `syncLinks`, `handleSubmit` |
| TypeScript (tipos/interfaces) | PascalCase | `PropertyFormData`, `FormPageShellConfig` |
| React (componentes) | PascalCase | `PropertyFormPage`, `EntityLinker`, `FormTabBar` |
| React (hooks) | use + camelCase | `useFormFiller`, `useEntityLink`, `useAuth` |
| Arquivos (componentes) | PascalCase.tsx | `PropertyFormPage.tsx`, `EntityLinker.tsx` |
| Arquivos (hooks) | camelCase.ts | `useFormFiller.ts`, `useAuth.ts` |
| Arquivos (services) | camelCase.ts | `entityLinksApi.ts`, `authService.ts` |
| Arquivos (schemas) | camelCase.schema.ts | `property.schema.ts`, `vehicle.schema.ts` |
| Arquivos (DTOs) | kebab-case.dto.ts | `create-property.dto.ts`, `update-vehicle.dto.ts` |
| Arquivos (migrations) | timestamp-desc.ts | `1709000000-add-phone-number.ts` |
| CSS classes | kebab-case (Tailwind) | `bg-primary-600`, `text-muted-foreground` |
| Env vars | UPPER_SNAKE_CASE | `GROQ_API_KEY`, `DATABASE_URL` |

### Modulos e GroupIds

- **ModuleId:** portugues, singular, lowercase — `patrimonio`, `financeiro`, `contatos`
- **GroupId:** portugues, plural, lowercase — `imoveis`, `veiculos`, `contas`
- **EntityType:** ingles, singular, lowercase — `property`, `vehicle`, `contact`

### Regras Adicionais

1. **Nunca** misturar convencoes (ex: `purchase_Price` ou `PurchasePrice` no DB)
2. **Sempre** usar nomes descritivos (minimo 2 palavras se necessario)
3. **Prefixos proibidos:** `data_`, `info_`, `get_` em colunas do DB
4. **Sufixos padrao:** `_id` para FK, `_at` para timestamps, `_count` para contadores

## Checklist

- [ ] Colunas DB em snake_case
- [ ] Variaveis/funcoes TS em camelCase
- [ ] Componentes React em PascalCase
- [ ] Hooks com prefixo use
- [ ] Arquivos seguem convencao do tipo
- [ ] ModuleId/GroupId em portugues lowercase

## IA Recomendada

- **Qualquer modo:** Todas as IAs devem respeitar estas convencoes. Incluir na instrucao do prompt.

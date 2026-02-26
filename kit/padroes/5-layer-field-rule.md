# Regra dos 5 Campos (5-Layer Field Rule)

## Quando Usar

- Adicionar QUALQUER campo novo ao sistema
- Verificar se campo existente esta completo em todas as camadas
- Debug de "campo sumindo" ou "dado nao salva"
- Auditoria de integridade de dados

## Keywords de Trigger

`novo campo`, `adicionar campo`, `field`, `whitelist`, `dado nao salva`, `campo sumindo`, `migration`, `dto`, `column`, `propriedade nova`

## O Padrao

### As 5 Camadas (TODAS Obrigatorias)

| # | Camada | Arquivo Tipico | Formato | Exemplo |
|---|--------|---------------|---------|---------|
| 1 | Entity | `models/property.entity.ts` | `@Column` TypeScript | `@Column({ name: 'phone_number', type: 'varchar', nullable: true })` |
| 2 | Migration | `migrations/XXX-add-phone.ts` | SQL ALTER TABLE | `ALTER TABLE properties ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50)` |
| 3 | DTO | `dtos/update-property.dto.ts` | `@IsString()` decorator | `@IsOptional() @IsString() phone_number?: string;` |
| 4 | Schema | `schemas/property.schema.ts` | `z.string()` Zod | `phone_number: z.string().optional()` |
| 5 | Form | `components/PropertyForm.tsx` | `<Input />` React | `<Input name="phone_number" label="Telefone" />` |

### Regra Critica: synchronize: false

O NestJS NUNCA deve sincronizar schema automaticamente em producao:
```typescript
// ormconfig.ts
{ synchronize: false } // SEMPRE! Migrations manuais apenas.
```

### Bug Prevenido: Whitelist Silent Discard

**O que acontece:** NestJS `ValidationPipe` com `whitelist: true` remove silenciosamente campos que NAO estao no DTO. O frontend envia o campo, o backend recebe, mas DESCARTA sem erro.

**Sintoma:** Campo aparece no form, usuario preenche, salva com sucesso, mas ao recarregar o valor sumiu.

**Prevencao:** SEMPRE adicionar o campo ao DTO com decorator `@IsOptional()` antes de usa-lo no form.

### Tipos de Decorator por Campo

| Tipo | Entity | DTO Decorator | Zod |
|------|--------|--------------|-----|
| string | `varchar` | `@IsString()` | `z.string()` |
| number | `decimal`/`integer` | `@IsNumber()` | `z.number()` |
| boolean | `boolean` | `@IsBoolean()` | `z.boolean()` |
| date | `date`/`timestamp` | `@IsDateString()` | `z.string()` (ISO) |
| enum | `enum` | `@IsEnum(MyEnum)` | `z.enum([...])` |
| JSON | `jsonb` | `@IsObject()`/`@IsArray()` | `z.object()`/`z.array()` |
| array | `text[]` | `@IsArray() @IsString({ each: true })` | `z.array(z.string())` |

## Checklist

- [ ] Campo na Entity com `@Column` e tipo correto (Camada 1)
- [ ] Migration criada com `ALTER TABLE ADD COLUMN IF NOT EXISTS` (Camada 2)
- [ ] Campo no DTO com `@IsOptional()` + decorator de tipo (Camada 3) **CRITICO**
- [ ] Campo no Schema Zod com tipo e validacao (Camada 4)
- [ ] Campo no Form com componente UI correto (Camada 5)
- [ ] Teste: salvar dados, recarregar pagina, verificar que o valor persiste

## IA Recomendada

- **Modo claude:** Claude faz as 5 camadas em sequencia, verificando cada uma
- **Modo economico:** Claude para Entity + DTO (criticos), DeepSeek para Migration + Schema + Form

## Exemplo de Uso

Adicionar campo `phone_number` ao modulo Property:

```typescript
// 1. Entity
@Column({ name: 'phone_number', type: 'varchar', length: 50, nullable: true })
phone_number: string;

// 2. Migration
await queryRunner.query(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50)`);

// 3. DTO (CRITICO!)
@IsOptional()
@IsString()
phone_number?: string;

// 4. Schema
phone_number: z.string().max(50).optional(),

// 5. Form
<Input name="phone_number" label="Telefone" placeholder="(XX) XXXXX-XXXX" />
```

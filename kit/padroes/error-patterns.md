# Error Patterns (Erros Conhecidos)

## Quando Usar

- Encontrar erro que parece familiar
- Debug de problemas recorrentes
- Prevencao antes de implementar feature
- Alimentar o error-kb com padroes conhecidos

## Keywords de Trigger

`whitelist`, `401`, `429`, `Object.assign`, `dark mode bug`, `erro conhecido`, `bug`, `dado sumindo`, `rate limit`

## O Padrao

### EP-01: Whitelist Silent Discard

**Sintoma:** Campo preenchido no form, salva com sucesso, ao recarregar o valor sumiu.

**Causa:** NestJS `ValidationPipe` com `whitelist: true` remove campos que nao estao no DTO. Nenhum erro, nenhum log.

**Solucao:**
1. Adicionar campo ao DTO com `@IsOptional()` + decorator de tipo
2. SEMPRE seguir as 5 camadas (ver `5-layer-field-rule.md`)

**Prevencao:** Checar DTO ANTES de criar campo no form.

**Severidade:** CRITICA (dados perdidos silenciosamente)

---

### EP-02: Google Photos API 401

**Sintoma:** `401 Unauthorized` ao tentar acessar Google Photos API.

**Causa:** Pode ser:
- API nao habilitada no Google Cloud Console
- Token expirado (refresh necessario)
- Scopes insuficientes na autorizacao

**Solucao:**
1. Verificar se API esta habilitada no Console
2. Verificar se token tem scopes corretos
3. Implementar refresh automatico de token

**Prevencao:** Sempre validar scopes no login, implementar retry com refresh.

**Severidade:** ALTA (funcionalidade indisponivel)

---

### EP-03: Groq 429 Rate Limit

**Sintoma:** `429 Too Many Requests` ao chamar Groq API.

**Causa:** Free tier tem limite de 30 req/min e 15K tokens/min.

**Solucao:**
1. Implementar backoff exponencial (wait 2s, 4s, 8s)
2. Usar fallback chain: Groq → Gemini Flash → Cache local
3. Agrupar requests (batch quando possivel)

**Prevencao:** Monitorar rate via headers `x-ratelimit-remaining`. Nao disparar mais de 1 req por segundo no FastFill.

**Severidade:** MEDIA (degradacao graceful para fallback)

---

### EP-04: Dark Mode Missing

**Sintoma:** Componente aparece com fundo branco ou texto invisivel no dark mode.

**Causa:** Classes CSS sem variante `dark:`.

**Solucao:**
1. Adicionar `dark:` para TODA classe de cor
2. Verificar: `bg-*`, `text-*`, `border-*`, `shadow-*`

**Prevencao:** Incluir no checklist de componente. Testar dark mode antes de commit.

**Severidade:** BAIXA (visual, nao funcional)

---

### EP-05: Object.assign Corruption

**Sintoma:** Campos de um objeto sobrescritos inesperadamente, dados misturados.

**Causa:** `Object.assign` faz shallow copy — objetos aninhados sao referencia, nao copia.

**Solucao:**
1. Usar spread operator para copia simples: `{ ...obj }`
2. Para deep copy: `structuredClone(obj)` ou `JSON.parse(JSON.stringify(obj))`
3. Criar helper `safeAssign()` que faz deep merge

**Prevencao:** NUNCA usar `Object.assign` com objetos que tem propriedades aninhadas.

**Severidade:** ALTA (corrupcao de dados silenciosa)

---

### EP-06: EntityLinker Silent Fail

**Sintoma:** Tab de links nao mostra opcoes, nenhum erro visivel.

**Causa:** Controller do modulo alvo nao tem endpoint `@Get()` raiz retornando `{ data: [{id, name}] }`.

**Solucao:** Criar endpoint `@Get()` no controller que retorna lista simplificada.

**Prevencao:** Ao configurar EntityLinker para novo modulo, verificar se endpoint existe.

**Severidade:** MEDIA (funcionalidade ausente sem feedback)

---

### EP-07: Migration em Producao

**Sintoma:** Dados alterados ou perdidos apos deploy.

**Causa:** Migration com `DROP COLUMN`, `ALTER TYPE`, ou dados incompativeis.

**Solucao:**
1. SEMPRE `ADD COLUMN IF NOT EXISTS` (nunca drop direto)
2. Para renomear: criar nova coluna → copiar dados → dropar antiga
3. Para mudar tipo: criar coluna temporaria → converter → swap

**Prevencao:** Revisar TODA migration antes de executar em producao. Backup obrigatorio.

**Severidade:** CRITICA (perda de dados irreversivel)

## Como Usar com Error KB

Estes padroes podem ser importados para o error-kb automaticamente:
```bash
node bin/ouro-intel.js error add "whitelist silent discard" --categoria logic --dificuldade 4 --solucao "Adicionar campo ao DTO" --tags whitelist,dto,campo-sumindo
```

## IA Recomendada

- **Qualquer modo:** Debugger agent deve consultar este arquivo PRIMEIRO antes de investigar

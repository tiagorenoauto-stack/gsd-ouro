# CONFIRM Before Code — Confirmar Antes de Codificar

## Quando Usar

**SEMPRE.** Este padrao e obrigatorio para QUALQUER tarefa que envolva gerar ou modificar codigo.
O unico momento que pode ser pulado: typos, perguntas informativas, leitura de arquivos.

## Keywords de Trigger

`sempre-ativo` — Este trigger tem priority 0 e e ativado em TODOS os contextos.

## O Padrao

### Problema que Resolve

A IA tende a "atropelar" pedidos: o usuario fala algo e a IA sai codificando
antes de confirmar se entendeu corretamente. Isto causa:

- Codigo gerado que nao era o que o usuario queria
- Quebra de funcionalidades que estavam OK
- Gasto desnecessario de tokens em abordagens erradas
- Trabalho feito no momento errado (fase incorreta)

### O Loop Correto

```
MATCH → DIFF → CONFIRM → GENERATE → UPDATE
```

O passo CONFIRM e inserido ANTES de qualquer geracao de codigo.

### Bloco CONFIRM (Formato Padrao)

Ao receber qualquer pedido de desenvolvimento, a IA DEVE apresentar:

```
CONFIRM — [titulo curto do pedido]

1. INTERPRETACAO
   "Entendi que voce quer: [descricao clara]"
   Escopo: [lista de arquivos/modulos afetados]

2. TIMING
   Fase atual: [N] — [X]% concluido
   Oportuno agora? [SIM/NAO]
   Se NAO: "Registrado para apos fase N. Motivo: [razao]"

3. BATCHING
   Pedidos pendentes relacionados: [lista ou "nenhum"]
   Sugestao: "Agrupar com [X] para editar [arquivo] 1x so"

4. VIABILIDADE
   Tecnica: [Alta/Media/Baixa] — [razao]
   Custo tokens: [~estimativa qualitativa: baixo/medio/alto]
   Risco de quebra: [Baixo/Medio/Alto] — [o que pode afetar]

5. OPCOES
   A) [opcao recomendada] <-- Recomendo
   B) [alternativa]
   C) [alternativa minima ou "adiar"]

6. RISCOS
   - [risco 1]
   - [risco 2]

7. RECOMENDACAO
   [acao sugerida clara e direta]

Autoriza? (opcao / ajustar / adiar)
```

### Regras do CONFIRM

1. **NUNCA pular** — Mesmo que o pedido pareca obvio, apresentar CONFIRM
2. **NUNCA codificar sem autorizacao** — Esperar "sim", "autoriza", opcao escolhida
3. **Se usuario adicionar requisitos** — Atualizar CONFIRM e reapresentar
4. **Se timing nao for oportuno** — Sugerir adiar e registrar para depois
5. **Se houver batching possivel** — SEMPRE sugerir agrupar
6. **Viabilidade baixa** — Alertar e sugerir alternativa viavel

### Timing — Verificacao de Oportunidade

Antes de recomendar execucao imediata, verificar:

- Qual fase estamos? (ler ROADMAP.md / STATE.md)
- A fase atual esta concluida?
- O pedido pertence a fase atual ou a uma futura?
- Seria mais eficiente finalizar a fase atual primeiro?

Se o pedido pertence a uma fase futura ou a fase atual tem itens pendentes
mais prioritarios, SUGERIR adiar e registrar o pedido.

### Batching — Agrupamento Inteligente

Ao receber um pedido, verificar:

- Ha outros pedidos pendentes/registrados que tocam os mesmos arquivos?
- Ha pedidos relacionados ao mesmo modulo/funcionalidade?
- Seria mais eficiente (menos tokens, menos risco) agrupar tudo?

Se sim, listar os pedidos relacionados e sugerir execucao conjunta,
priorizando por: criticidade > dependencia > eficiencia.

### Viabilidade — Analise de Custo-Beneficio

Avaliar sempre:

- **Tecnica**: O que se pede e possivel com a arquitetura atual?
- **Tokens**: Quanto contexto/geracao sera necessario? Vale o custo?
- **Risco**: Que partes funcionais podem ser afetadas?
- **Alternativa**: Ha forma mais simples de atingir o objetivo?

## Checklist

- [ ] Bloco CONFIRM apresentado ao usuario
- [ ] Interpretacao validada pelo usuario
- [ ] Timing verificado (fase atual vs pedido)
- [ ] Batching verificado (pedidos relacionados)
- [ ] Viabilidade avaliada (tecnica + tokens + risco)
- [ ] Opcoes apresentadas com recomendacao
- [ ] Autorizacao explicita recebida
- [ ] Se "adiar" → pedido registrado para depois

## IA Recomendada

Qualquer — este padrao e comportamental, nao depende de modelo.

## Exemplo de Uso

**Usuario:** "quero um botao de logout bonito"

**IA (ERRADO — sem CONFIRM):**
```
Aqui esta o componente LogoutButton...
[200 linhas de codigo]
```

**IA (CORRETO — com CONFIRM):**
```
CONFIRM — Botao de Logout

1. INTERPRETACAO
   "Entendi: criar componente Button de logout com estilo premium."
   Escopo: provavel header global ou sidebar

2. TIMING
   Fase atual: 2 — 60% concluido (modulo financeiro)
   Oportuno agora? NAO — estamos no meio do modulo financeiro.
   Sugestao: registrar para fase de UI polish.

3. BATCHING
   Pendente: tambem ha pedido de "melhorar header"
   Sugestao: agrupar logout + header na mesma execucao

4. VIABILIDADE
   Tecnica: Alta — componente simples
   Custo tokens: Baixo (~50 linhas)
   Risco de quebra: Baixo — componente novo isolado

5. OPCOES
   A) Adiar para fase UI e agrupar com header <-- Recomendo
   B) Implementar agora (rapido, componente isolado)
   C) Apenas definir spec e adiar codigo

6. RISCOS
   - Se implementar agora, pode conflitar com mudancas futuras no header

7. RECOMENDACAO
   Adiar e agrupar com pedido de header. Mais eficiente.

Autoriza? (A / B / C / ajustar)
```

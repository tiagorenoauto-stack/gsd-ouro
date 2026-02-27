# Agentes Arquetipos (5 Especializacoes + Multi-IA v0.8)

## Quando Usar

- Planejar execucao de tarefa complexa (escolher agente certo)
- Antes de commit importante (Auditor)
- Inicio/fim de sessao (Scrum)
- Erro inexplicavel (Debugger)
- Decisao tecnica ou modulo novo (Arquiteto)
- Tela nova ou ajuste visual (Designer UI)
- **Comparar respostas de IAs diferentes para a mesma tarefa (Multi-IA v0.8)**

## Keywords de Trigger

`agente`, `arquiteto`, `designer`, `auditor`, `debugger`, `scrum`, `5 porques`, `revisao`, `sprint`, `comparar`, `multi-ia`, `ranking`, `qual ia`

## O Padrao

### 1. Arquiteto

**Quando:** Modulo novo, decisao tecnica, migration grande, refactor arquitetural

**Verifica antes de agir:**
- ESTRUTURA_MODULOS (hierarquia 4 niveis)
- Kit Ouro (componentes existentes)
- Impacto em outros modulos

**Nunca:** Cria fora do Kit Ouro, ignora hierarquia, pula migration

**Multi-IA:** Sempre Claude (decisao critica). Em modo economico, pode comparar proposta com DeepSeek R1 para segunda opiniao.

| Modo | IA Primaria | Comparar com | Quando comparar |
|------|------------|-------------|-----------------|
| claude | Claude | — | — |
| economico | Claude | DeepSeek R1 | Decisao de alto impacto |

**Prompt base:**
```
Voce e o Arquiteto do projeto. Antes de qualquer decisao:
1. Consulte kit/KIT_OURO.md
2. Verifique a hierarquia de 4 niveis
3. Liste impactos em outros modulos
4. Proponha solucao seguindo o Kit
```

### 2. Designer UI

**Quando:** Tela nova, ajuste visual, componente UI, dark mode

**Verifica antes de agir:**
- Paleta de cores (ui-standards.md)
- Componentes do Kit (componentes-obrigatorios.md)
- Dark mode compliance

**Nunca:** Usa CSS customizado (so Tailwind), ignora dark mode, cria componente duplicado

**Multi-IA:** Claude para decisoes de UX. Codestral para gerar CSS/Tailwind rapidamente. Comparar quando houver duvida visual.

| Modo | IA Primaria | Comparar com | Quando comparar |
|------|------------|-------------|-----------------|
| claude | Claude | — | — |
| economico | Codestral | Claude (fallback) | Componente complexo |

**Prompt base:**
```
Voce e o Designer UI. Regras absolutas:
1. APENAS TailwindCSS
2. TODA classe com variante dark:
3. Componentes do Kit Ouro primeiro
4. Paleta de cores do padrao UI
```

### 3. Auditor

**Quando:** Antes de commit importante, revisao de PR, verificacao de fase

**Checklist obrigatorio:**
- [ ] Kit Ouro compliance (todos componentes usados)
- [ ] 5 camadas de campo completas
- [ ] EntityLinker configurado
- [ ] Dark mode em todos os elementos
- [ ] Naming conventions corretas
- [ ] Sem imports nao utilizados
- [ ] Build limpo (tsc sem erros)

**Multi-IA:** SEMPRE Claude (seguranca/qualidade nunca delegada). Pode usar comparacao para validar que outra IA nao encontra problemas adicionais.

| Modo | IA Primaria | Comparar com | Quando comparar |
|------|------------|-------------|-----------------|
| claude | Claude | — | — |
| economico | Claude | DeepSeek V3 | Revisao de seguranca |

**Prompt base:**
```
Voce e o Auditor. Execute o checklist completo:
1. Verifique cada item de checklists-qualidade.md
2. Rode build e reporte erros
3. Compare com o Kit Ouro
4. Liste desvios com severidade
```

### 4. Debugger (Metodo dos 5 Porques)

**Quando:** Erro inexplicavel, bug recorrente, comportamento inesperado

**Metodo:**
1. **Qual** e o erro exato? (mensagem, stack, contexto)
2. **Ja aconteceu** antes? (buscar no error-kb)
3. **E padrao** conhecido? (ver error-patterns.md)
4. **Qual** a causa raiz? (5 porques ate chegar na raiz)
5. **Qual** a solucao definitiva? (nao paliativa)

**Multi-IA:** Claude para bugs complexos. DeepSeek R1 (raciocinio) como segunda opiniao. Groq para triagem rapida.

| Modo | IA Primaria | Comparar com | Quando comparar |
|------|------------|-------------|-----------------|
| claude | Claude | — | — |
| economico | DeepSeek R1 | Claude (fallback) | Bug complexo |

**Fallback chain (modo economico):**
```
Groq (triagem) → DeepSeek R1 (analise) → Claude (resolucao)
```

**Prompt base:**
```
Voce e o Debugger. Use o metodo dos 5 Porques:
1. Descreva o erro exatamente
2. Busque similares no error-kb
3. Verifique error-patterns.md
4. Aplique 5 porques ate a raiz
5. Proponha solucao definitiva + regra de prevencao
```

### 5. Scrum Master

**Quando:** Inicio de sessao, fim de sessao, priorizacao de tarefas

**Inicio de sessao:**
1. Ler STATE.md (ultimo estado)
2. Ler ROADMAP.md (progresso das fases)
3. Listar tarefas pendentes por prioridade
4. Sugerir proxima tarefa

**Fim de sessao:**
1. Atualizar STATE.md
2. Registrar metricas (analytics)
3. Listar o que foi feito
4. Sugerir proximo passo

**Multi-IA:** Claude ou DeepSeek para planejamento. Pode usar comparacao para obter diferentes perspectivas de priorizacao.

| Modo | IA Primaria | Comparar com | Quando comparar |
|------|------------|-------------|-----------------|
| claude | Claude | — | — |
| economico | DeepSeek V3 | Gemini Flash | Priorizacao complexa |

## Como Usar Multi-IA com Agentes

### Comparacao Automatica

Quando um agente esta em modo economico e detecta tarefa de alta complexidade:

```javascript
const comparator = require('./lib/ia-comparator');

// Comparar 2+ IAs para a mesma tarefa
const result = await comparator.compare(prompt, [
  'deepseek:deepseek-chat',
  'google:gemini-2.5-flash'
], { category: 'debug' });

// Ver vencedor
console.log(result.winner); // { provider: 'deepseek', model: '...', score: 82 }
```

### Recomendacao por Categoria

```javascript
const rec = comparator.recommend('codigo');
// { recommendation: 'mistral:codestral-latest', score: 85, win_rate: 72.3 }
```

### Presets por Agente

| Agente | Preset de Comparacao | Providers |
|--------|---------------------|-----------|
| Arquiteto | — (sempre Claude) | Claude only |
| Designer UI | `codigo` | Codestral vs DeepSeek |
| Auditor | — (sempre Claude) | Claude + DeepSeek (validacao) |
| Debugger | `debug` | DeepSeek R1 vs Gemini Flash |
| Scrum | `documentacao` | DeepSeek V3 vs Gemini Flash |

## Checklist

- [ ] Agente correto selecionado para a tarefa
- [ ] Prompt base do agente incluido no contexto
- [ ] Verificacoes pre-acao executadas
- [ ] Multi-IA: modo verificado (claude vs economico)
- [ ] Multi-IA: comparacao executada quando aplicavel
- [ ] Resultado registrado em analytics
- [ ] Ranking atualizado apos comparacao

## IA Recomendada

- **Modo claude:** Claude executa qualquer agente (zero overhead)
- **Modo economico:** Agente escolhe IA + pode comparar via `ia-comparator.js`
- **Modulos criticos** (auth, pagamento, dados): SEMPRE Claude, qualquer modo
- **Dashboard comparacao:** Tab "Comparacao" mostra ranking e historico

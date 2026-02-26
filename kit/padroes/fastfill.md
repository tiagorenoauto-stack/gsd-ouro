# FastFill — IA Economica para Preenchimento

## Quando Usar

- Preenchimento automatico de formularios baseado em input parcial
- Sugestoes inteligentes de campos (modulo, categoria, contato)
- Qualquer micro-tarefa de IA que precisa ser < 500ms
- Classificacao rapida de entidades

## Keywords de Trigger

`preenchimento automatico`, `auto-fill`, `sugestao campo`, `fastfill`, `groq`, `micro-especialista`, `FormFiller`

## O Padrao

### Arquitetura: 2 Micro-Especialistas em Paralelo

```
Input do usuario (titulo/nome)
         |
    ┌────┴────┐
    v         v
 Esp. 1    Esp. 2
 Modulo    Relacoes
    |         |
    v         v
 {module,   {contactId,
  unitId,    destModule,
  category}  destCategory}
    |         |
    └────┬────┘
         v
   Slots UI (3 slots)
```

**Especialista 1 (Modulo):** Detecta modulo, unidade e categoria do input
**Especialista 2 (Relacoes):** Detecta contato, modulo destino e categoria destino

### Configuracao do Provider

- **Modelo:** `llama-3.1-8b-instant` via Groq
- **Latencia:** ~300ms (free tier)
- **Custo:** $0 (free tier Groq)
- **Temperature:** 0.3 (respostas precisas em JSON)
- **Max tokens:** 256 (respostas curtas)
- **Rate limit:** 30 req/min, 15K tokens/min

### Silent Slots (UI Pattern)

3 slots que aparecem SOMENTE quando ha sugestao:

| Slot | Conteudo | Cor | Estado |
|------|----------|-----|--------|
| Slot 0 | Modulo + Unidade + Categoria | Purple | hidden → suggested → accepted |
| Slot 1 | Destino (modulo + categoria) | Violet | hidden → suggested → accepted |
| Slot 2 | Contato detectado | Blue | hidden → suggested → accepted |

**Estados:** `hidden` (invisivel) → `suggested` (aparece com animacao) → `accepted` (usuario confirmou)

### Componentes React

| Componente | Funcao |
|-----------|--------|
| `useFormFiller` | Hook que analisa titulo e dispara 2 especialistas |
| `FormFillerNameInput` | Input com botao Sparkles + "Ctrl+Enter para sugestoes" |
| `FormFillerSlots` | Renderiza os 3 slots com estados |

### Prompt Template (Especialista 1)

```
Analise o titulo: "{input}"
Retorne JSON: { "moduleId": "...", "unitId": "...|null", "category": "...|null" }
Modulos validos: patrimonio, financeiro, contatos, trading, organizacao, servicos
Responda APENAS o JSON, sem explicacao.
```

### Fallback Chain

1. Groq (primary, free, 300ms)
2. Gemini Flash (fallback, free, 500ms)
3. Cache local de sugestoes anteriores (offline, 0ms)

## Checklist

- [ ] useFormFiller hook integrado no FormPage
- [ ] FormFillerNameInput como campo de titulo
- [ ] FormFillerSlots renderizados abaixo do titulo
- [ ] Groq API key configurada no .env
- [ ] Fallback chain implementada
- [ ] Rate limiting respeitado (30 req/min)

## IA Recomendada

- **Modo claude:** Claude configura a integracao, Groq executa o FastFill
- **Modo economico:** Igual (FastFill SEMPRE usa Groq por design — e gratuito)

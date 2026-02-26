# /ouro:prompt — Gerador de Prompts Inteligente

Quando o usuário digitar `/ouro:prompt "texto"`, execute este fluxo:

## Fluxo Principal

### 1. CAPTURA

Receba o texto do usuário em linguagem natural.

### 2. COLETA DE CONTEXTO (automático)

Leia e resuma:

- `.ouro/PROJECT.md` — nome, stack, público
- `.ouro/STATE.md` — fase atual, último trabalho
- `.ouro/KIT_OURO.md` — componentes disponíveis, padrões
- `.ouro/active_context.md` — contexto da sessão

### 3. DETECÇÃO DE TIPO E OTIMIZAÇÃO

Detectar tipo de tarefa e montar prompt otimizado:

- Código → framework RISE com XML
- Documentação → framework Markdown estruturado
- Debug → framework XML com contexto de erro
- Testes → framework RISE com specs

A otimização roda dentro do Claude (modo padrão) ou via provider externo (modo econômico).

### 4. PREVIEW

Mostrar prompt otimizado com:

- Tokens estimados
- Opções: [1] Aprovar [2] Editar [3] Regenerar [4] Cancelar

### 5. EXECUÇÃO

Se aprovado, executar o prompt.

### 6. REGISTRO

```bash
node bin/ouro-track.js prompt --input "texto original" --tipo Codigo --tokens 500
```

## Flags

- `--rapido` — Pula preview, executa direto
- `--direto` — Sem otimização, envia seu texto como está
- `--preview` — Só mostra prompt, não executa
- `--comparar` — Gera 2-3 variações para comparar

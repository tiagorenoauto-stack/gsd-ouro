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

### 3. SELEÇÃO DE IA DESTINO
Baseado no tipo de tarefa detectado:
- Código → Codestral (grátis) ou Claude (complexo)
- Documentação → Gemini Pro (grátis)
- Testes → DeepSeek V3 (grátis)
- Debug → Claude Sonnet (pago)
- Ou usar `--para [ia]` se especificado

### 4. OTIMIZAÇÃO
Enviar para IA econômica (Gemini/DeepSeek) com meta-prompt que inclui:
- Texto do usuário
- Contexto do projeto resumido
- Framework adequado (XML para Claude, RISE para código, etc.)
- Regras do Kit Ouro

### 5. PREVIEW
Mostrar prompt otimizado com:
- IA otimizadora usada
- IA destino selecionada
- Tokens estimados e custo
- Opções: [1] Aprovar [2] Editar [3] Regenerar [4] Cancelar

### 6. EXECUÇÃO
Se aprovado, enviar para IA destino.

### 7. REGISTRO
```bash
node bin/ouro-track.js prompt --input "texto original" --tipo Codigo --ia codestral --tokens 500
```

## Flags
- `--rapido` — Pula preview, executa direto
- `--direto` — Sem otimização, envia seu texto como está
- `--preview` — Só mostra prompt, não executa
- `--comparar` — Gera 2-3 variações para comparar
- `--para [ia]` — Força IA destino específica

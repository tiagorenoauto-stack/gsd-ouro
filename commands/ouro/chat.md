# /ouro:chat — Chat Interativo para Gerar Prompts

Quando o usuario digitar `/ouro:chat`:

## Workflow

1. Abrir modo chat interativo
2. Usuario escreve em linguagem natural (ex: "quero um botao de logout bonito")
3. **Classificar intencao** via `lib/chat-engine.js`:
   ```javascript
   const chat = require('./lib/chat-engine');
   const result = chat.processMessage(mensagem, historico, config);
   ```
4. Apresentar interpretacao ao usuario:
   - "Entendi: [resumo]. Correto?"
5. Se usuario confirmar → gerar prompt CO-STAR com triggers auto-injetados
6. Se usuario corrigir → aplicar correcoes e reapresentar
7. Registrar historico em `.ouro/chat/history.json`

## Fluxo Tipico

```
Usuario: "quero um botao de logout bonito"
IA: "Entendi: Criar botao no modulo (nao detectado), estilo premium.
     Em qual modulo? Header, Sidebar, ou outro?"
Usuario: "no header global"
IA: "Criar botao de logout no Header global, estilo premium. Correto?"
Usuario: "sim"
→ Prompt CO-STAR gerado com triggers: componentes-obrigatorios, ui-standards
```

## Intencoes Suportadas

- `generate_prompt` — Gerar prompt (padrao)
- `ask_question` — Pergunta (redireciona ao Claude)
- `fix_bug` — Correcao (sugere /ouro:debug)
- `refactor` — Refatoracao
- `note` — Salvar nota (redireciona ao Notes Engine)
- `confirm` / `deny` — Fluxo de confirmacao

## IA Usada: Claude (interpretacao requer raciocinio)

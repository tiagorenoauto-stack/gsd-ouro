# Template: Novo Formulário

## Prompt Template (XML — Claude)

```xml
<role>
Desenvolvedor React sênior especializado em formulários do Kit Padrão Ouro.
</role>

<context>
Projeto: {PROJETO} | Stack: {STACK}
Módulo: {MODULO} > Grupo: {GRUPO} > Unidade: {NOME}Form
Rota: {ROTA}
</context>

<task>
Criar formulário {NOME}Form com os campos:
{LISTA_CAMPOS}

Estrutura:
1. Seções agrupadas logicamente
2. Validação inline com feedback visual
3. Botões: Salvar (primary) + Cancelar (ghost)
4. Modal de confirmação antes de salvar
</task>

<constraints>
- Componentes: FormField, Input, Button, Modal do Kit
- Validação: regras em arquivo separado {NOME}Validation.js
- Hook: useForm custom em use{NOME}Form.js
- Estado: useState/useReducer (sem Redux)
- NÃO usar CSS custom
</constraints>

<file_structure>
src/pages/{MODULO_PATH}/{NOME}/
  {NOME}Page.jsx
  use{NOME}Form.js
  {NOME}Validation.js
</file_structure>

<verify>
□ Todos campos validados
□ Feedback visual em erros
□ Modal de confirmação funciona
□ Responsivo mobile/desktop
□ Labels acessíveis em todos inputs
</verify>
```

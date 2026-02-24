# Template: Novo Componente

## Variáveis
- `{NOME}` — Nome do componente (PascalCase)
- `{MODULO}` — Módulo pai
- `{GRUPO}` — Grupo
- `{PROPS}` — Lista de props
- `{ROTA}` — Rota da página (se aplicável)

## Prompt Template (XML — Claude)

```xml
<role>
Desenvolvedor React sênior seguindo Kit Padrão Ouro do projeto {PROJETO}.
</role>

<context>
Projeto: {PROJETO}
Stack: {STACK}
Módulo: {MODULO} > Grupo: {GRUPO} > Unidade: {NOME}
Rota: {ROTA}
</context>

<task>
Criar componente {NOME} com as seguintes características:
{DESCRICAO}
</task>

<constraints>
- USAR APENAS componentes do Kit Ouro (ver KIT_OURO.md)
- NÃO criar CSS custom — apenas TailwindCSS
- NÃO usar bibliotecas externas de UI
- Acessibilidade: labels, aria-*, focus states
- Responsivo: mobile-first
</constraints>

<file_structure>
src/{MODULO_PATH}/{NOME}.jsx
</file_structure>

<verify>
□ Componentes são do Kit Ouro
□ Nenhum CSS custom
□ Responsivo mobile/desktop
□ Labels acessíveis
□ Props tipadas
</verify>
```

# Framework: XML (Otimizado para Claude)

## Quando Usar
Sempre que a IA destino for Claude (Sonnet, Haiku, Opus).
Claude processa XML 30-50% mais eficientemente que texto livre.

## Estrutura

```xml
<role>
{papel especializado baseado na tarefa}
</role>

<context>
Projeto: {nome}
Stack: {stack}
Módulo: {módulo} > Grupo: {grupo} > Unidade: {unidade}
Rota: {rota}
Componentes anteriores: {últimos 2-3 criados}
</context>

<task>
{descrição detalhada da tarefa}
{lista numerada de sub-tarefas}
</task>

<constraints>
- {restrição 1 — componentes permitidos}
- {restrição 2 — o que NÃO fazer}
- {restrição 3 — padrões obrigatórios}
</constraints>

<file_structure>
{estrutura de arquivos esperada}
</file_structure>

<verify>
□ {critério 1}
□ {critério 2}
□ {critério N}
</verify>
```

## Variáveis Substituídas Automaticamente
- `{nome}` → de PROJECT.md
- `{stack}` → de PROJECT.md
- `{módulo/grupo/unidade}` → de ROADMAP.md + STATE.md
- `{rota}` → inferida do padrão do projeto
- Componentes e constraints → de KIT_OURO.md

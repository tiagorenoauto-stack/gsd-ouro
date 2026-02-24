# LOOP DE EXECUÇÃO

## MATCH → DIFF → GENERATE → UPDATE

Toda tarefa de desenvolvimento segue este loop obrigatório:

### 1. MATCH
Verificar no KIT_OURO.md se o componente, padrão ou estrutura já existe.
- Se existe → usar como referência
- Se não existe → anotar para criar

### 2. DIFF
Comparar o estado atual com o estado desejado.
- O que já está pronto?
- O que falta?
- O que precisa mudar?

### 3. GENERATE
Gerar código/conteúdo seguindo o padrão do Kit.
- Usar IA adequada (ver DELEGACAO_IA.md)
- Respeitar constraints do Kit
- Incluir verificação no prompt

### 4. UPDATE
Atualizar artefatos do projeto.
- Código gerado → commit atômico
- Novo padrão criado → adicionar ao KIT_OURO.md
- Métricas → registrar em analytics/
- STATE.md → atualizar progresso

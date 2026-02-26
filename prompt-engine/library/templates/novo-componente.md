# Template: Novo Componente

## CO-STAR

**C — Context:**
Projeto: {projeto}. Stack: {stack}. Kit de componentes definido em KIT_OURO.md.
Fase atual: {fase}. Componentes existentes: {componentes_kit}.

**O — Objective:**
Criar componente {nome_componente} para {funcionalidade}.
Deve seguir os padrões do Kit e reutilizar componentes existentes.

**S — Style:**
Código limpo, modular, com tipagem (se TypeScript).
Seguir convenções do projeto: {convencoes}.

**T — Tone:**
Técnico e preciso.

**A — Audience:**
Desenvolvedor do projeto.

**R — Response:**
Código funcional pronto para uso. Incluir:
- Arquivo do componente
- Estilos (se necessário)
- Tipos/interfaces
- Exemplo de uso

## Técnica Sugerida
Few-shot + Chain-of-Thought (componente é complexidade média)

## Checklist de Verificação
- [ ] MATCH no KIT_OURO.md antes de criar
- [ ] Reutiliza componentes existentes do Kit
- [ ] Segue padrões de nomenclatura do projeto
- [ ] Responsivo (se UI)
- [ ] Acessível (aria-labels, semântica)

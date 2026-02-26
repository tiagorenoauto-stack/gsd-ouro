# Template: Refatoração

## CO-STAR

**C — Context:**
Projeto: {projeto}. Stack: {stack}.
Módulo alvo: {modulo}. Motivo da refatoração: {motivo}.
Código atual: {codigo_atual}.

**O — Objective:**
Refatorar {alvo} para {objetivo_refactor}.
Manter comportamento externo idêntico. Melhorar: {aspecto} (legibilidade/performance/manutenibilidade).

**S — Style:**
Código limpo seguindo princípios SOLID (quando aplicável).
Preferir composição sobre herança. Funções pequenas e focadas.

**T — Tone:**
Técnico e preciso.

**A — Audience:**
Desenvolvedor do projeto.

**R — Response:**
1. Resumo das mudanças (o que e por quê)
2. Código refatorado completo
3. Impacto em outros arquivos (se houver)

## Técnica Sugerida
Few-shot + Chain-of-Thought (refatoração é complexidade média)
Se envolve múltiplos módulos → Tree-of-Thought

## Checklist de Verificação
- [ ] Comportamento externo inalterado
- [ ] Testes existentes continuam passando
- [ ] Melhora mensurável no aspecto alvo
- [ ] Sem over-engineering
- [ ] Segue padrões do KIT_OURO.md

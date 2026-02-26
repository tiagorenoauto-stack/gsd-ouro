# Template: Documentação

## CO-STAR

**C — Context:**
Projeto: {projeto}. Stack: {stack}.
O que documentar: {alvo}. Público-alvo: {publico}.
Documentação existente: {docs_existentes}.

**O — Objective:**
Criar documentação para {alvo} que permita {publico} entender e usar {funcionalidade} sem assistência adicional.

**S — Style:**
Documentação clara e bem estruturada.
Exemplos práticos. Linguagem acessível ao público-alvo.

**T — Tone:**
Didático e explicativo.

**A — Audience:**
{publico} — ajustar complexidade e terminologia ao nível do leitor.

**R — Response:**
Documento em Markdown com:
- Visão geral / O que é
- Como usar (com exemplos)
- Referência de API/Props (se aplicável)
- FAQ ou Troubleshooting (se relevante)

## Técnica Sugerida
Zero-shot (documentação é geralmente direta)
Se documentação de arquitetura complexa → Few-shot + CoT

## Checklist de Verificação
- [ ] Acessível ao público-alvo definido
- [ ] Exemplos funcionais incluídos
- [ ] Estrutura navegável (headers, links)
- [ ] Sem jargão desnecessário
- [ ] Consistente com docs existentes

# Template: Bug Fix

## CO-STAR

**C — Context:**
Projeto: {projeto}. Stack: {stack}.
Fase atual: {fase}. Arquivo com problema: {arquivo}.
Erro observado: {erro}. Comportamento esperado: {esperado}.

**O — Objective:**
Corrigir o bug em {arquivo} onde {descricao_bug}.
O comportamento correto deve ser: {esperado}.

**S — Style:**
Correção cirúrgica — alterar o mínimo necessário.
Não refatorar código ao redor. Manter estilo existente.

**T — Tone:**
Analítico e investigativo.

**A — Audience:**
Desenvolvedor do projeto.

**R — Response:**
1. Análise da causa raiz (2-3 linhas)
2. Código corrigido (diff mínimo)
3. Como testar a correção

## Técnica Sugerida
Zero-shot (bug fixes são geralmente diretos)
Se bug complexo → Few-shot + CoT

## Checklist de Verificação
- [ ] Identifica causa raiz, não só sintoma
- [ ] Alteração mínima e cirúrgica
- [ ] Não quebra outras funcionalidades
- [ ] Inclui forma de testar

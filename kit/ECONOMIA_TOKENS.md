# ECONOMIA DE TOKENS

## Princípios

1. **Contexto mínimo necessário** — Enviar apenas o que a IA precisa, não o projeto inteiro
2. **Prompts otimizados** — Usar o Gerador de Prompts para máxima eficiência
3. **IA certa para tarefa certa** — IAs gratuitas para volume, Claude para qualidade
4. **Cache de contexto** — Reutilizar contexto entre tarefas da mesma sessão
5. **Compactação diferencial** — Comprimir histórico preservando decisões

## Técnicas de Economia

- **XML para Claude:** Tags XML são 30-50% mais eficientes que texto livre
- **Referências ao Kit:** "Seguir KIT_OURO.md seção X" em vez de copiar o conteúdo
- **Verify blocks:** Checklist no final evita retrabalho (economia de 2-3x)
- **Modo rápido:** Para tarefas simples, pular planejamento completo
- **Batch de tarefas:** Agrupar tarefas similares numa única chamada

## Meta de Economia

- **Mínimo 80%** dos tokens em IAs gratuitas
- **Máximo 20%** dos tokens em Claude (somente decisões e verificação)
- **Meta de custo:** < $0.10 por hora de desenvolvimento

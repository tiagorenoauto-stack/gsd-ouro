# ECONOMIA DE TOKENS

## Principios

1. **Contexto minimo necessario** — Enviar apenas o que a IA precisa, nao o projeto inteiro
2. **Prompts otimizados** — Usar o Gerador de Prompts para maxima eficiencia
3. **Cache de contexto** — Reutilizar contexto entre tarefas da mesma sessao
4. **Compactacao diferencial** — Comprimir historico preservando decisoes

## Tecnicas de Economia

- **XML para Claude:** Tags XML sao 30-50% mais eficientes que texto livre
- **Referencias ao Kit:** "Seguir KIT_OURO.md secao X" em vez de copiar o conteudo
- **Verify blocks:** Checklist no final evita retrabalho (economia de 2-3x)
- **Modo rapido:** Para tarefas simples, pular planejamento completo
- **Batch de tarefas:** Agrupar tarefas similares numa unica chamada

## Modos de Operacao

- **Modo `claude` (padrao):** Claude faz tudo — incluso no plano, sem custo extra
- **Modo `economico` (opt-in):** Skills podem usar providers externos (Codestral, Gemini, DeepSeek)
- Trocar modo: editar `modo` em `.ouro/config.json`

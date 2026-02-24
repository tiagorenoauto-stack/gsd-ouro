# Workflow: Dashboard Web

## Descrição
Abre dashboard web local para visualização de métricas.

## Trigger
`/ouro:dashboard` ou `npm run dashboard`

## Fluxo

```
/ouro:dashboard
  │
  ├─ Verificar se .ouro/analytics/ existe
  ├─ Iniciar servidor em http://localhost:3333
  ├─ Abrir navegador automaticamente
  │
  └─ Dashboard mostra 6 páginas:
      ├─ 1. Visão Geral (progresso, economia, velocidade, qualidade)
      ├─ 2. Economia e Custos (por IA, por tarefa, projeção)
      ├─ 3. Performance das IAs (tabela comparativa, recomendações)
      ├─ 4. Gerador de Prompts (versão web)
      ├─ 5. Histórico de Sessões (filtros por data/fase/IA)
      └─ 6. Qualidade e Conformidade (desvios, padrões)
```

## Stack
- React 18 + Recharts + TailwindCSS (via CDN)
- Servidor Node.js local (scripts/dashboard-server.js)
- Single HTML File (dashboard/index.html)
- Zero dependências externas

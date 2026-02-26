# Formulario Unificado (Regra de Uma Pagina)

## Quando Usar

- Criar novo modulo ou grupo no sistema
- Planejar estrutura de paginas de um modulo
- Verificar se modulo esta seguindo o padrao

## Keywords de Trigger

`nova pagina`, `list page`, `form page`, `criar modulo`, `estrutura modulo`, `novo grupo`, `DetailPage`

## O Padrao

### Regra: Maximo 2 Paginas por Modulo

```
Todo modulo tem NO MAXIMO 2 paginas:
1. ListPage  — lista com busca, filtros, batch actions
2. FormPage  — criar / ver / editar (MESMO componente)

NUNCA criar DetailPage separada.
```

### Deteccao Automatica de Modo

O FormPage detecta o modo automaticamente pela URL:
- `/module/new` → campos vazios, botao "Criar"
- `/module/:id` → carrega dados, campos editaveis, botao "Salvar"

```typescript
// Dentro do FormPage
const { id } = useParams();
const isNew = !id || id === 'new';
// isNew ? modo criacao : modo edicao
```

### Se Precisa de Visualizacoes Extras

Se o modulo precisa de timeline, sub-listas, graficos ou outras visualizacoes:
- Usar **TABS** dentro do FormPage
- NUNCA criar pagina separada
- Exemplos: tab "Historico", tab "Transacoes", tab "Graficos"

### Estrutura de Rotas

```
/module          → ListPage
/module/new      → FormPage (modo criacao)
/module/:id      → FormPage (modo edicao)
```

Nenhuma outra rota deve existir para o modulo.

## Checklist

- [ ] Modulo tem no maximo 2 paginas (List + Form)
- [ ] FormPage usa FormPageShell como wrapper
- [ ] Deteccao automatica de modo (new vs edit) via URL
- [ ] Visualizacoes extras em tabs, nao em paginas separadas
- [ ] Nenhuma DetailPage ou ViewPage existe
- [ ] Rotas seguem padrao: /module, /module/new, /module/:id

## IA Recomendada

- **Modo claude:** Claude planeja estrutura e cria ambas as paginas
- **Modo economico:** Claude para estrutura, Codestral para ListPage boilerplate

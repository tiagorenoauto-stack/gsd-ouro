# UI Standards (Padroes Visuais)

## Quando Usar

- Criar qualquer componente visual
- Definir cores, gradientes, espacamento
- Verificar conformidade visual
- Implementar dark mode

## Keywords de Trigger

`cor`, `gradiente`, `botao`, `spacing`, `design`, `layout`, `dark mode`, `palette`, `estilo`, `visual`

## O Padrao

### Paleta de Cores

| Uso | Tailwind Classes | Hex Referencia |
|-----|-----------------|----------------|
| Primary | `primary-{50-950}` | Cyan/Sky Blue |
| Secondary | `secondary-{50-950}` | Slate/Gray |
| Success | `green-{100-800}` | #4ade80 |
| Error | `red-{100-900}` | #f87171 |
| Alert | `yellow/amber-{100-800}` | #fbbf24 |
| Info | `blue-{50-800}` | #60a5fa |
| Accent IA | `purple-{500-700}` | #a855f7 |

### Gradientes por Modulo

| Modulo | Gradiente | Uso |
|--------|-----------|-----|
| Agenda | `from-amber-500 to-orange-500` | Header, badges |
| Imoveis | `from-blue-500 to-blue-600` | Header, badges |
| Veiculos | `from-orange-500 to-amber-600` | Header, badges |
| Financeiro | `from-emerald-500 to-green-600` | Header, badges |
| Crypto | `from-yellow-500 to-amber-500` | Header, badges |
| IA | `from-purple-500 to-indigo-500` | Header, badges |
| Contatos | `from-sky-500 to-cyan-500` | Header, badges |
| Servicos | `from-rose-500 to-pink-500` | Header, badges |

### Botoes (Variantes)

| Variante | Uso | Classe Tailwind |
|----------|-----|----------------|
| Primary | Acao principal (Salvar, Criar) | `bg-primary-600 text-white hover:bg-primary-700` |
| Secondary | Alternativa (Cancelar, Voltar) | `bg-secondary-100 text-secondary-700` |
| Outline | Terciario | `border border-primary-600 text-primary-600` |
| Danger | Deletar/Remover | `bg-red-600 text-white hover:bg-red-700` |
| Ghost | Minimal, icones | `text-muted-foreground hover:bg-muted` |

**Tamanhos:** `sm` (h-8 px-3 text-xs), `default` (h-10 px-4 text-sm), `lg` (h-12 px-6 text-base)

### Tab Bar (FormTabBar)

- **SEMPRE** pill style (rounded-full)
- **Active:** `bg-primary-600 text-white`
- **Inactive:** `bg-muted text-muted-foreground`
- **NUNCA** underline style
- **Scroll horizontal** quando muitas tabs

### Espacamento de Formularios

| Elemento | Classe | Quando |
|----------|--------|--------|
| Entre secoes | `space-y-6` | SEMPRE entre blocos de campos |
| Grid de campos | `grid grid-cols-1 md:grid-cols-2 gap-4` | Campos lado a lado |
| Labels | `text-sm font-medium` | Todos os labels |
| Cards | `p-4 rounded-lg border` | Agrupamento visual |
| Secoes | `gap-6` | Entre grupos de cards |

### Dark Mode (Obrigatorio)

**Regra:** TODA classe de cor deve ter variante `dark:`

```html
<!-- CORRETO -->
<div class="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">

<!-- ERRADO (sem dark mode) -->
<div class="bg-white text-zinc-900">
```

**Background hierarchy:**
- Page: `bg-white dark:bg-zinc-950`
- Card: `bg-zinc-50 dark:bg-zinc-900`
- Elevated: `bg-zinc-100 dark:bg-zinc-800`
- Border: `border-zinc-200 dark:border-zinc-700`

### Icones

| Tamanho | Classe | Uso |
|---------|--------|-----|
| sm | `w-4 h-4` (16px) | Inline, badges |
| md | `w-5 h-5` (20px) | Botoes, menus |
| lg | `w-6 h-6` (24px) | Headers, destaque |

**Biblioteca:** Lucide React (padrao) ou Heroicons

## Checklist

- [ ] Cores seguem paleta padrao
- [ ] Gradiente correto para o modulo
- [ ] Botoes usam variantes padrao
- [ ] Tab bar pill-style (nao underline)
- [ ] Spacing segue grid padrao
- [ ] Dark mode em TODOS os elementos
- [ ] Icones nos tamanhos padrao

## IA Recomendada

- **Modo claude:** Claude para design decisions
- **Modo economico:** Claude para paleta/decisoes, Codestral para implementacao Tailwind

# Componentes Obrigatorios do Kit Ouro

## Quando Usar

- Verificar se um formulario esta usando todos os componentes do Kit
- Criar novo formulario (precisa de pelo menos FormPageShell + FormTabBar)
- Auditoria de conformidade com Kit Ouro

## Keywords de Trigger

`componente`, `component`, `shell`, `filler`, `kit ouro`, `tab bar`, `currency`, `select`, `photo`, `document`

## O Padrao

### Componentes UI (12 Obrigatorios)

| # | Componente | Diretorio | Funcao | Obrigatorio Em |
|---|-----------|-----------|--------|---------------|
| 1 | FormPageShell | components/common/ | Container padrao de TODOS os forms | Todo FormPage |
| 2 | EntityLinker | components/shared/ | Ligacao cross-modulo | Todo FormPage |
| 3 | CollapsibleCategories | components/shared/ | Grupos collapsiveis de categorias | Todo FormPage |
| 4 | FormTabBar | components/common/ | Navegacao pill-style entre tabs | Todo FormPage |
| 5 | CurrencyInput | components/ui/ | Campos monetarios (via Controller) | Tabs com valores |
| 6 | TypeSelect | components/common/ | Select searchable single | Campos com opcoes |
| 7 | TypeSelectMulti | components/common/ | Select searchable multi + tags | Campos multi-opcao |
| 8 | PhotoCarousel | components/ui/ | Carousel hero + lightbox (portal z-99999) | Tab fotos |
| 9 | PhotoManager | components/ui/ | Upload/edit de fotos | Tab fotos |
| 10 | DocumentManager | components/ui/ | Upload/edit de documentos | Tab documentos |
| 11 | GroupTypesTab | components/settings/ | Gerenciamento de categorias por grupo | Settings |
| 12 | CollapsibleSection | components/ui/ | Secao expansivel com badge + action | Detalhes |

### Componentes IA (3 Obrigatorios)

| # | Componente | Funcao |
|---|-----------|--------|
| 1 | useFormFiller | Hook: analisa titulo → dispara 2 especialistas Groq |
| 2 | FormFillerNameInput | Input com botao Sparkles + "Ctrl+Enter" |
| 3 | FormFillerSlots | Renderiza 3 slots: modulo+unidade, destino, contato |

### CSS Obrigatorio

- **Framework:** APENAS TailwindCSS (nenhum CSS customizado)
- **Card spacing:** `p-4`
- **Section spacing:** `gap-6`
- **Borders:** `rounded-lg`
- **Dark mode:** TODAS as classes com prefixo `dark:`
- **Sem inline styles**
- **Sem CSS modules**

### Regras de Uso

1. **Nunca recriar** um componente que ja existe no Kit
2. **Sempre importar** do diretorio padrao
3. **Reportar** se encontrar componente duplicado
4. **Propor** novo componente ao Kit antes de criar

## Checklist

- [ ] FormPageShell como wrapper do form
- [ ] FormTabBar para navegacao de tabs (pill style)
- [ ] EntityLinker integrado (automatico via Shell)
- [ ] CollapsibleCategories integrado (automatico via Shell)
- [ ] CurrencyInput para campos monetarios
- [ ] TypeSelect/TypeSelectMulti para selects
- [ ] PhotoCarousel + PhotoManager para fotos
- [ ] DocumentManager para documentos
- [ ] useFormFiller + FormFillerNameInput para FastFill
- [ ] Todos os estilos usando TailwindCSS + dark:

## IA Recomendada

- **Modo claude:** Claude para integracao e verificacao
- **Modo economico:** DeepSeek para boilerplate de componentes, Claude para verificacao

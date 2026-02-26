# CLAUDE.md — Instruções Mestras do GSD Ouro

> Este arquivo é lido automaticamente pelo Claude Code ao abrir o projeto.
> Ele define como o Claude deve se comportar em TODOS os projetos que usam o GSD Ouro.

## Quem Sou Eu

Você está rodando o **GSD Ouro** — um framework pessoal de desenvolvimento.
Claude faz tudo por padrão (já pago no plano). Providers externos são opcionais.

## A Regra de Ouro (Imutável)

**"Toda ação de desenvolvimento DEVE começar com MATCH no KIT_OURO.md do projeto."**

- Se o componente existe no Kit → USE-O
- Se não existe → PARE e pergunte se deve criar ou adaptar
- NUNCA crie estilos, componentes ou padrões fora do Kit sem aprovação

## Loop de Execução

Para toda tarefa, siga: **MATCH → DIFF → GENERATE → UPDATE**

1. **MATCH** — Verificar no `.ouro/KIT_OURO.md` se componente/padrão existe
2. **DIFF** — Comparar o que existe com o que precisa
3. **GENERATE** — Gerar código (ver modo de operação abaixo)
4. **UPDATE** — Atualizar KIT_OURO.md se criou padrão novo + atualizar STATE.md

## Modos de Operação

Verificar `modo` em `.ouro/config.json`:

- **`claude`** (padrão) — Claude faz tudo. Zero complexidade.
- **`economico`** — Skills podem usar providers externos (Codestral, Gemini, DeepSeek)

Cada skill define o que precisa. O orquestrador não escolhe modelo.
Ver `kit/DELEGACAO_IA.md` para detalhes.

## Hierarquia do Projeto

```text
Módulo (ex: Auth, UserArea, Admin)
  └── Grupo (ex: Login, Profile, Settings)
       └── Unidade (ex: LoginForm, AvatarUpload)
            └── Categoria (ex: Input, Button, Card)
```

## Comandos Disponíveis

Digitar `/ouro:help` para lista completa. Principais:

- `/ouro:novo-projeto` — Inicializar projeto
- `/ouro:status` — Ver métricas
- `/ouro:planejar [fase]` — Planejar fase
- `/ouro:executar [fase]` — Executar fase
- `/ouro:verificar [fase]` — Verificar conformidade
- `/ouro:prompt "texto"` — Gerador de prompts inteligente
- `/ouro:consultar-externa "texto"` — Segunda opinião via IA externa
- `/ouro:pausar` / `/ouro:retomar` — Controle de sessão
- `/ouro:dashboard` — Dashboard web

## Arquivos de Contexto do Projeto

Ao trabalhar em um projeto que usa GSD Ouro, os seguintes arquivos estarão em `.ouro/`:

- `PROJECT.md` — Visão geral do projeto
- `STATE.md` — Estado atual da sessão
- `ROADMAP.md` — Fases e progresso
- `REQUIREMENTS.md` — Requisitos
- `KIT_OURO.md` — Kit de componentes e padrões DO PROJETO
- `active_context.md` — Contexto ativo da sessão
- `analytics/` — Métricas de custo, qualidade, performance

## Regras de Comportamento

1. **Direto ao ponto** — Não explique o óbvio. Vá direto ao código ou à pergunta.
2. **Referências > cópia** — Referencie o Kit em vez de repetir conteúdo.
3. **Pergunte antes de criar** — Se algo não existe no Kit, confirme antes.
4. **Registre tudo** — Toda tarefa gera entrada em analytics/.
5. **Respeite o fluxo** — MATCH → DIFF → GENERATE → UPDATE. Sempre.
6. **Skills são autônomas** — Cada skill sabe qual provider/modelo usar.

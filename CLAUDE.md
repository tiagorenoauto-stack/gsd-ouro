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

Para toda tarefa, siga: **MATCH → DIFF → CONFIRM → GENERATE → UPDATE**

1. **MATCH** — Verificar no `.ouro/KIT_OURO.md` se componente/padrão existe
2. **DIFF** — Comparar o que existe com o que precisa
3. **CONFIRM** — Apresentar bloco CONFIRM ao usuário (ver abaixo). **NUNCA pular este passo.**
4. **GENERATE** — Gerar código somente após autorização explícita
5. **UPDATE** — Atualizar KIT_OURO.md se criou padrão novo + atualizar STATE.md

## CONFIRM — Confirmar Antes de Codificar (Obrigatório)

**NUNCA** comece a codificar sem apresentar o bloco CONFIRM e receber autorização.

Antes de gerar qualquer código, apresentar:

1. **Interpretação** — "Entendi que você quer: [X]". Escopo: arquivos/módulos afetados.
2. **Timing** — Fase atual e progresso. É oportuno agora ou devemos finalizar a fase atual primeiro? Se não for oportuno → registrar pedido para depois.
3. **Batching** — Há pedidos pendentes relacionados? Se sim, sugerir agrupar para tocar cada arquivo 1x só.
4. **Viabilidade** — Técnica (Alta/Média/Baixa) + Custo estimado de tokens + Risco de quebrar algo existente.
5. **Opções** — Mínimo 2 alternativas com prós/contras. Marcar a recomendada.
6. **Riscos** — O que pode dar errado.
7. **Recomendação** — Ação sugerida clara.

Finalizar com: `Autoriza? (opção / ajustar / adiar)`

**Exceções** (pode pular CONFIRM): correções de typo, perguntas informativas, leitura de arquivos.

**Ref:** [kit/padroes/confirm-before-code.md](kit/padroes/confirm-before-code.md)

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
5. **Respeite o fluxo** — MATCH → DIFF → CONFIRM → GENERATE → UPDATE. Sempre.
6. **CONFIRM obrigatório** — NUNCA codifique sem apresentar interpretação + viabilidade + opções e receber autorização.
7. **Skills são autônomas** — Cada skill sabe qual provider/modelo usar.

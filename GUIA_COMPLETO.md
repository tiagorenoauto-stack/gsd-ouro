# GSD Ouro — Guia Completo

> Tudo o que precisa saber para usar, configurar e evoluir o framework.

---

## 1. O Que É o GSD Ouro

Framework pessoal de desenvolvimento assistido por IA. Princípio central:

**"Toda ação DEVE começar com MATCH no KIT_OURO.md"**

O Kit é a fonte única de verdade. Se algo não está no Kit, não existe — pergunte antes de criar.

### Loop de Execução (Sempre)

```
MATCH → DIFF → GENERATE → UPDATE
```

1. **MATCH** — Componente/padrão existe no Kit?
2. **DIFF** — O que existe vs o que precisa
3. **GENERATE** — Gerar código seguindo o Kit
4. **UPDATE** — Atualizar Kit + STATE.md se criou algo novo

---

## 2. Modos de Operação

### Modo `claude` (Padrão — Qualidade Full)

```json
{ "modo": "claude" }
```

- Claude faz **tudo**: decisões, código, revisão, testes
- Zero configuração extra, zero custo adicional (incluído no plano)
- Máxima qualidade e coerência — um único modelo entende o contexto inteiro
- Ideal para: projetos críticos, lógica complexa, decisões arquiteturais

**Quando usar:** Sempre que qualidade > economia. É o padrão por bons motivos.

### Modo `economico` (Delegação a IAs Externas)

```json
{ "modo": "economico" }
```

- Claude continua nas decisões críticas (arquitetura, segurança, lógica core)
- Tarefas simples são delegadas a providers gratuitos:

| Provider | Modelo | Custo | Melhor Para |
|----------|--------|-------|-------------|
| Groq | llama-3.3-70b | Grátis | Boilerplate, formatação |
| Gemini | gemini-2.5-flash | Grátis | Documentação, análise longa |
| DeepSeek | deepseek-v3 | Grátis | Testes, código simples |
| Ollama | llama3.2 | Grátis (local) | Fallback offline |

**O que NUNCA é delegado (sempre Claude):**
- Autenticação, pagamentos, lógica crítica
- Decisões de arquitetura
- Revisão de segurança
- Verificação de conformidade com o Kit

### Como Alternar Entre Modos

Editar `.ouro/config.json`:

```json
{
  "version": "0.3.0",
  "modo": "claude",        ← mudar para "economico" quando quiser
  "provedores_externos": {
    "groq": { "endpoint": "https://api.groq.com/openai/v1/chat/completions", "env_key": "GROQ_API_KEY" },
    "google": { "endpoint": "https://generativelanguage.googleapis.com/v1beta", "env_key": "GEMINI_API_KEY" },
    "deepseek": { "endpoint": "https://api.deepseek.com/chat/completions", "env_key": "DEEPSEEK_API_KEY" }
  }
}
```

Para providers externos, criar `.env` com as chaves:

```bash
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AI...
DEEPSEEK_API_KEY=sk-...
```

### Comparação Direta

| Aspecto | Modo Claude | Modo Econômico |
|---------|-------------|----------------|
| Qualidade | Máxima | Alta (Claude) + Boa (externos) |
| Custo extra | Zero | Zero (providers grátis) |
| Coerência | Total (1 modelo) | Boa (mas fragmentada) |
| Setup | Zero config | Precisa de API keys |
| Velocidade | Rápido | Variável (depende do provider) |
| Offline | Não | Sim (via Ollama) |

**Recomendação:** Use modo `claude` por padrão. Mude para `economico` apenas se:
- Tem muitas tarefas repetitivas/boilerplate
- Quer experimentar outros modelos
- Precisa de fallback offline (Ollama)

---

## 3. Estrutura do Framework

```
gsd-ouro/
├── CLAUDE.md                    # Instruções mestras (lido auto pelo Claude Code)
├── .ouro/
│   ├── config.json              # Modo + providers
│   ├── PROJECT.md               # Visão geral do projeto
│   ├── STATE.md                 # Estado atual da sessão
│   ├── ROADMAP.md               # Fases e progresso
│   ├── REQUIREMENTS.md          # Requisitos
│   ├── KIT_OURO.md              # Fonte de verdade (componentes + padrões)
│   ├── active_context.md        # Contexto da sessão ativa
│   └── analytics/               # Métricas
│       ├── dashboard.json       # Métricas agregadas
│       ├── sessoes/             # Histórico de sessões
│       ├── fases/               # Progresso por fase
│       ├── ias/                 # Performance por IA
│       └── prompts/historico.json
├── kit/                         # Documentação do framework
│   ├── DELEGACAO_IA.md          # Como funciona multi-IA
│   ├── ECONOMIA_TOKENS.md       # Técnicas de economia
│   ├── LOOP_EXECUCAO.md         # MATCH→DIFF→GENERATE→UPDATE
│   └── REGRAS.md                # Regras imutáveis
├── commands/ouro/               # Skills (cada comando é uma skill)
│   ├── prompt.md                # Gerador de prompts
│   ├── planejar.md              # Planejar fase
│   ├── executar.md              # Executar fase
│   ├── verificar.md             # Verificar conformidade
│   ├── status.md                # Ver métricas
│   ├── pausar.md / retomar.md   # Controle de sessão
│   └── rapido.md                # Tarefa ad-hoc
├── workflows/                   # Orquestração
│   ├── gerador-prompts.md       # Workflow do prompt generator
│   ├── executar-fase.md         # Workflow de execução
│   └── dashboard-web.md         # Workflow do dashboard
├── lib/                         # Módulos internos
│   ├── ai-providers.js          # Interface genérica de providers
│   └── analytics.js             # Tracking de métricas
├── scripts/                     # Utilitários
│   ├── dashboard-server.js      # Servidor HTTP (porta 3333)
│   └── test-providers.js        # Teste de conectividade
└── dashboard/
    └── index.html               # Dashboard web (zero dependências)
```

---

## 4. Skills — Como Foram Criadas e Como Usar

### O Que São Skills

Cada comando `/ouro:*` é uma **skill** — um arquivo `.md` em `commands/ouro/` que o Claude lê como instrução. Não é código executável; é um **prompt estruturado** que ensina o Claude a executar aquela tarefa.

### Como Uma Skill Funciona

```
Usuário digita: /ouro:prompt "criar botão de logout"
                    ↓
Claude lê: commands/ouro/prompt.md
                    ↓
Segue as instruções do arquivo:
  1. Coleta contexto (PROJECT, STATE, KIT)
  2. Detecta tipo de tarefa
  3. Otimiza o prompt
  4. Mostra preview
  5. Executa se aprovado
  6. Registra em analytics
```

### Lista Completa de Skills

| Skill | Comando | Para Que Serve |
|-------|---------|----------------|
| **Prompt** | `/ouro:prompt "texto"` | Gerar prompt otimizado com contexto do projeto |
| **Planejar** | `/ouro:planejar [fase]` | Decompor fase em tarefas atômicas (~30min cada) |
| **Executar** | `/ouro:executar [fase]` | Executar tarefas do plano com tracking |
| **Verificar** | `/ouro:verificar [fase]` | Checar conformidade com o Kit |
| **Status** | `/ouro:status` | Ver progresso, custos, qualidade |
| **Dashboard** | `/ouro:dashboard` | Abrir dashboard web na porta 3333 |
| **Pausar** | `/ouro:pausar` | Salvar contexto antes de sair |
| **Retomar** | `/ouro:retomar` | Continuar de onde parou |
| **Rápido** | `/ouro:rapido "texto"` | Tarefa ad-hoc sem planejamento formal |
| **Novo Projeto** | `/ouro:novo-projeto` | Instalar GSD Ouro num projeto |
| **Help** | `/ouro:help` | Ver comandos disponíveis |

### Dicas de Uso das Skills

1. **Sempre comece com `/ouro:retomar`** ao abrir uma sessão — ele carrega o contexto
2. **Use `/ouro:prompt` antes de tarefas complexas** — ele otimiza e adiciona contexto automaticamente
3. **`/ouro:rapido` para coisas pequenas** — bug fix, ajuste de CSS, adicionar campo
4. **`/ouro:planejar` + `/ouro:executar` para fases inteiras** — tracking completo
5. **`/ouro:verificar` depois de cada fase** — garante que nada fugiu do Kit
6. **`/ouro:pausar` antes de fechar** — nunca perca contexto

### Como Criar Uma Nova Skill

Criar arquivo em `commands/ouro/nome-da-skill.md` com esta estrutura:

```markdown
---
name: ouro:nome-da-skill
description: O que a skill faz
---

# /ouro:nome-da-skill

## Quando Usar
[contexto]

## Passos
1. [passo 1]
2. [passo 2]

## Output
[o que deve ser gerado]

## Regras
- [regra 1]
- [regra 2]
```

Depois, referenciar em `CLAUDE.md` na seção de comandos.

---

## 5. Dicas Para Trabalhar Melhor

### Fluxo Ideal de Uma Sessão

```
1. Abrir terminal no projeto
2. /ouro:retomar                    → carrega contexto
3. /ouro:status                     → ver onde estamos
4. /ouro:planejar "fase X"          → se precisa planejar
5. /ouro:executar "fase X"          → executa com tracking
   ou /ouro:rapido "fix bug Y"      → para tarefas pequenas
6. /ouro:verificar "fase X"         → checa conformidade
7. /ouro:pausar                     → salva antes de sair
```

### Maximizando Qualidade no Modo Claude

1. **Seja específico** — "adicionar campo telefone no ContactFormPage com máscara brasileira" > "adicionar campo"
2. **Referencie o Kit** — "seguindo o padrão FormPageShell do Kit" ajuda o Claude a manter coerência
3. **Uma tarefa por vez** — o Claude é melhor em tarefas focadas do que em listas enormes
4. **Use `/ouro:prompt`** — ele adiciona contexto que você esqueceria de mencionar
5. **Verifique sempre** — `/ouro:verificar` depois de mudanças grandes
6. **Confie no extended thinking** — para decisões de arquitetura, deixe o Claude pensar

### Economia de Tokens (Ambos os Modos)

1. **XML tags** — 30-50% mais eficientes que texto livre para estruturar prompts
2. **Referências > cópias** — "ver KIT_OURO.md seção Componentes" em vez de copiar o conteúdo
3. **Blocos de verificação** — adicionar "verifique X antes de Y" evita retrabalho (economiza 2-3x)
4. **Modo rápido** — `/ouro:rapido` pula planejamento formal para tarefas simples
5. **Batch** — agrupar tarefas similares em uma chamada

### Erros Comuns a Evitar

- **Criar componente sem checar o Kit** — viola a Regra de Ouro
- **Esquecer de atualizar STATE.md** — próxima sessão começa sem contexto
- **Não usar `/ouro:pausar`** — perde o contexto ao fechar
- **Prompt vago** — "melhore isso" gera resultado genérico
- **Ignorar `/ouro:verificar`** — acumula desvios do Kit

---

## 6. O Gerador de Prompts — Estado Atual

### Como Funciona Hoje

```
Input do usuário: "criar módulo de relatórios"
        ↓
Coleta Contexto Automático:
  ├─ PROJECT.md → nome, stack, público
  ├─ STATE.md → fase atual, trabalho recente
  ├─ KIT_OURO.md → componentes, padrões
  └─ active_context.md → sessão ativa
        ↓
Detecta Tipo + Framework:
  ├─ Código → RISE + XML
  ├─ Docs → Markdown estruturado
  ├─ Debug → XML com contexto de erro
  └─ Testes → RISE com specs
        ↓
Preview (modo full) ou Execução Direta (--rapido)
        ↓
Registra em analytics/prompts/historico.json
```

### Flags Disponíveis

| Flag | Efeito |
|------|--------|
| `--rapido` | Pula preview, executa direto |
| `--direto` | Sem otimização, envia como está |
| `--preview` | Mostra apenas, não executa |
| `--comparar` | Gera 2-3 variações para escolher |

---

## 7. Sugestões de Melhoria Para o GSD Ouro

### 7.1 Gerador de Prompts — Evoluir Para Nível Profissional

O gerador atual usa RISE + XML. Para transformá-lo num dos melhores do setor:

#### A) Adotar CO-STAR Como Framework Base

CO-STAR (vencedor da competição GPT-4 de Singapura) cobre 6 dimensões que o RISE não tem:

```
C — Context    (contexto do projeto, estado atual, histórico)
O — Objective  (objetivo específico e mensurável)
S — Style      (estilo de escrita/código)
T — Tone       (tom: técnico, didático, conciso)
A — Audience   (quem vai consumir: dev, usuário, CI/CD)
R — Response   (formato esperado: código, JSON, markdown, lista)
```

**Implementação sugerida:** O gerador preenche C, S, A automaticamente a partir dos arquivos `.ouro/`. O usuário só precisa informar O (objetivo). T e R têm defaults inteligentes por tipo de tarefa.

#### B) Otimização Específica Por Modelo

Cada modelo responde melhor a um estilo diferente. O gerador deve adaptar:

| Modelo | Estilo Ideal |
|--------|-------------|
| **Claude** | XML tags, instruções explícitas, extended thinking para complexos |
| **GPT** | Structured output, JSON schema, menos scaffolding |
| **Gemini** | Multimodal, contexto longo, Deep Think para lógica |
| **DeepSeek** | Direto, técnico, conciso — sem floreios |
| **Groq/Llama** | Few-shot com exemplos, instruções detalhadas |

**Implementação:** Campo `modelo_alvo` no prompt. Se não especificado, usa o modelo do modo atual. O workflow adapta XML tags, estrutura e nível de detalhe automaticamente.

#### C) Técnicas Avançadas Automáticas

O gerador deve selecionar a técnica baseado na complexidade:

| Complexidade | Técnica | Quando |
|-------------|---------|--------|
| Simples | Zero-shot | Bug fix, ajuste, campo novo |
| Média | Few-shot + CoT | Componente novo, refactor |
| Alta | Tree-of-Thought | Decisão arquitetural, múltiplas abordagens |
| Crítica | Self-Consistency | Lógica financeira, segurança |

**Implementação:** Analisar o input e selecionar automaticamente. Se `--comparar`, usar Self-Consistency (gerar 3 variações, mostrar a mais consistente).

#### D) Auto-Otimização (Inspirado em DSPy)

Em vez de um prompt fixo, o gerador pode:

1. Gerar 3 variações do prompt (diferentes frameworks/técnicas)
2. Estimar qualidade de cada um (baseado em clareza, contexto, especificidade)
3. Apresentar o melhor como default, os outros como alternativas

**Implementação:** Flag `--otimizar` que gera múltiplas versões e ranqueia.

#### E) Prompt Verificador (Reflection)

Antes de executar, o prompt passa por auto-crítica:

```
"Antes de executar, analise este prompt:
1. O objetivo está claro e mensurável?
2. Tem contexto suficiente?
3. O formato de saída está definido?
4. Tem ambiguidades que podem gerar resultado errado?
Se sim, corrija e mostre a versão melhorada."
```

#### F) Banco de Prompts Eficazes

Salvar prompts que geraram bons resultados com score de qualidade:

```
analytics/prompts/
  ├── historico.json          # Todos os prompts
  ├── top_prompts.json        # Os melhores (score > 8/10)
  └── templates/              # Templates reutilizáveis por tipo
      ├── novo-componente.md
      ├── bug-fix.md
      ├── refactor.md
      └── documentacao.md
```

### 7.2 Status Em Tempo Real No Projeto

Hoje: `STATE.md` é estático, atualizado manualmente.

**Proposta: Status dinâmico com output visual no terminal**

```
╔══════════════════════════════════════════════╗
║  GSD OURO — Appvida                    ⚡ claude  ║
╠══════════════════════════════════════════════╣
║  Fase: 2 — Replicação Modelo Dourado         ║
║  Progresso: ████████████████░░░░ 75%          ║
║  Sessão: #30 (26/02)                          ║
║                                               ║
║  ✅ FormPageShell      16/16                  ║
║  ✅ Kit Ouro IA        19/19                  ║
║  ✅ FormFillerNameInput 16/16                 ║
║  ✅ EntityLinker        20/20                 ║
║  ⏳ Migration           pendente              ║
║                                               ║
║  Próximo: Migration NormalizeGroupIds         ║
║  Build: tsc ✅  vite ✅                       ║
╚══════════════════════════════════════════════╝
```

**Implementação:**
- Skill `/ouro:status` já existe — melhorar para gerar este output
- Adicionar hook para exibir mini-status ao início de cada tarefa
- Dashboard web já tem os dados — conectar ao mesmo JSON

### 7.3 Outras Melhorias Sugeridas

#### Analytics Mais Ricos

- **Tempo por tarefa** — saber quanto cada tipo de tarefa demora
- **Score de qualidade** — verificar automaticamente após cada tarefa (conformidade com Kit)
- **Heatmap de atividade** — visualizar quais módulos recebem mais trabalho

#### Workflow de Verificação Contínua

Após cada `GENERATE`, rodar automaticamente:

```
1. tsc (TypeScript sem erros?)
2. Kit compliance check (todos os componentes seguem o Kit?)
3. Import check (barrel exports corretos?)
```

#### Templates Inteligentes

Em vez de templates genéricos, templates que se auto-preenchem:

```markdown
# Ao criar novo FormPage:
- Detecta módulo pelo path
- Preenche FormPageShell com tabs do módulo
- Adiciona EntityLinker configurado
- Conecta Kit Ouro IA (useFormFiller)
- Gera schema Zod baseado na entity
```

#### Multi-Projeto

Hoje cada projeto é isolado. Futuramente:

- Dashboard global mostrando todos os projetos
- Compartilhar Kit entre projetos com estilos similares
- Métricas agregadas cross-projeto

---

## 8. Roadmap Sugerido Para Evolução do GSD Ouro

### v0.4 — Prompt Generator Pro
- [ ] Framework CO-STAR como base
- [ ] Otimização por modelo (Claude, GPT, Gemini, DeepSeek)
- [ ] Seleção automática de técnica (zero-shot, CoT, ToT)
- [ ] Flag `--otimizar` com múltiplas variações
- [ ] Banco de prompts eficazes (top_prompts.json)

### v0.5 — Status Em Tempo Real
- [ ] Output visual bonito no terminal (`/ouro:status`)
- [ ] Mini-status automático ao início de cada tarefa
- [ ] Integração com dashboard web em tempo real
- [ ] Notificações de build/erro inline

### v0.6 — Verificação Contínua
- [ ] Auto-verificação após cada GENERATE
- [ ] Score de qualidade automático
- [ ] Templates auto-preenchidos por tipo de tarefa

### v0.7 — Multi-Projeto
- [ ] Dashboard global
- [ ] Kit compartilhado entre projetos
- [ ] Métricas cross-projeto

---

## Referências e Benchmarks

### Frameworks de Prompts Pesquisados

| Framework | Componentes | Complexidade | Veredicto |
|-----------|-------------|-------------|-----------|
| **CO-STAR** | 6 (Context, Objective, Style, Tone, Audience, Response) | Alta | **Recomendado como base** |
| **RISEN** | 5 (Role, Instructions, Steps, End Goal, Narrowing) | Alta | Bom para tarefas complexas |
| **CRISPE** | 5 (Capacity, Info, Statement, Personality, Experiment) | Alta | Bom para criatividade |
| **RACE** | 4 (Role, Action, Context, Expectation) | Média | Boa alternativa simples |
| **RISE** | 4 (Role, Input, Steps, Expectation) | Média | Atual do GSD Ouro |

### Ferramentas de Referência

| Ferramenta | O Que Faz | O Que Podemos Aprender |
|-----------|----------|----------------------|
| **DSPy** (Stanford) | Otimização programática de prompts | Auto-otimização, transferência entre modelos |
| **Anthropic Console** | Gerador + melhorador de prompts | Preview, comparação lado a lado, avaliação |
| **PromptPerfect** | Refinamento automático | One-click optimization, reverse engineering |
| **LangSmith** | Versionamento de prompts | Canvas interativo, testes em escala |

### Dicas Específicas Para Claude

1. **XML tags** continuam eficazes — Claude foi treinado com elas
2. **Instruções no human message** > system message para detalhes
3. **Claude 4.x é literal** — faz exatamente o que pede, nada mais
4. **Extended thinking** — ativar para decisões complexas (10/10 eficácia)
5. **Documentos longos** — pedir para citar trechos relevantes antes de analisar
6. **Menos scaffolding** — modelos modernos precisam de menos "muletas" no prompt

---

> **TL;DR:** Use modo `claude` para qualidade máxima. O gerador de prompts pode evoluir drasticamente adotando CO-STAR + otimização por modelo + seleção automática de técnicas. O status em tempo real no terminal é viável e melhora muito o fluxo de trabalho.

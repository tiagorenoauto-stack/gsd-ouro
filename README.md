# 🏆 GSD OURO — Kit Padrão Ouro

**Sistema de desenvolvimento inteligente com orquestração multi-IA para Claude Code**

> Claude decide. IAs econômicas executam. Você economiza 90%+.

---

## O Que É

O GSD Ouro é um kit de desenvolvimento que transforma o Claude Code em um sistema inteligente de orquestração multi-IA. Ele:

- **Orquestra múltiplas IAs** — Claude para decisões, IAs gratuitas para volume
- **Segue padrões rigorosos** — Kit Padrão Ouro garante consistência
- **Rastreia tudo** — Métricas de custo, tempo, qualidade e performance
- **Otimiza prompts** — Você fala normal, o sistema gera prompts profissionais
- **Dashboard web** — Visualize métricas no navegador

## Instalação Rápida

```bash
# Via NPM (quando publicado)
npx gsd-ouro@latest

# Via Git (desenvolvimento)
git clone https://github.com/tiagorenoauto-stack/gsd-ouro.git
cd gsd-ouro
node bin/install.js --global
```

## Comandos Principais

| Comando | O Que Faz |
|---------|-----------|
| `/ouro:help` | Lista todos os comandos |
| `/ouro:novo-projeto` | Inicializa projeto com Kit Ouro |
| `/ouro:status` | Dashboard com métricas completas |
| `/ouro:planejar [fase]` | Planeja uma fase |
| `/ouro:executar [fase]` | Executa uma fase |
| `/ouro:verificar [fase]` | Verifica conformidade |
| `/ouro:prompt "texto"` | Gerador de prompts inteligente |
| `/ouro:dashboard` | Abre dashboard web |

## Estrutura

```
gsd-ouro/
├── commands/ouro/     ← Slash commands
├── agents/            ← Agentes especializados
├── kit/               ← Coração: regras e padrões
├── workflows/         ← Lógica de orquestração
├── templates/         ← Templates base para projetos
├── prompt-engine/     ← Gerador de prompts inteligente
├── analytics/         ← Motor de métricas
├── hooks/             ← Hooks do Claude Code
├── scripts/           ← Utilitários
└── docs/              ← Manuais completos
```

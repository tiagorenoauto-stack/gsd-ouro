# Projeto: GSD Ouro

## Descricao

Framework pessoal de desenvolvimento assistido por IA. Orquestra sessoes de coding com Kit de padroes, analytics, inteligencia contextual, comparacao Multi-IA e dashboard interativo.

Principio central: "Toda acao DEVE comecar com MATCH no KIT_OURO.md"

## Stack

- **Runtime:** Node.js (CommonJS)
- **IA Principal:** Claude (via Claude Code CLI)
- **IA Externas:** Mistral/Codestral, Gemini, DeepSeek, Groq, Ollama (modo economico)
- **Dashboard:** HTML/CSS/JS vanilla (servido via http nativo, porta 3333)
- **Storage:** JSON files em .ouro/analytics/
- **Nenhuma dependencia externa** (zero npm install)

## Publico-Alvo

Desenvolvedor solo (Tiago) que usa Claude Code como assistente principal de desenvolvimento. O framework padroniza, rastreia e otimiza o fluxo de trabalho entre humano e IA.

## Repositorio

- **GitHub:** tiagorenoauto-stack/gsd-ouro
- **Branch:** main
- **Versao:** 0.9.0 (Auto-Update)

## Estrutura

```
gsd-ouro/
  .ouro/            Estado, config, analytics do projeto
  commands/ouro/    Skills (slash commands)
  dashboard/        Dashboard web (HTML unico)
  kit/              Kit de padroes, delegacao, mapa
    padroes/        15 padroes documentados
  lib/              Motores (prompt, triggers, chat, notes, comparator, providers...)
  scripts/          Dashboard server, CLI helpers
```

# Template: Documentação de API

## Prompt Template (Markdown — Gemini)

```markdown
# Tarefa: Documentar API {ENDPOINT}

## Contexto
Projeto: {PROJETO} | Stack: {STACK}
Módulo: {MODULO}

## O Que Fazer
Gerar documentação Markdown da API com endpoints listados abaixo.
Para cada endpoint incluir: método, URL, body params, responses (200/400/401/500),
exemplo curl e exemplo response JSON.

## Endpoints
{LISTA_ENDPOINTS}

## Formato de Saída
Markdown com:
- Tabelas para params
- Code blocks para exemplos curl
- Code blocks para responses JSON
- Estilo: conciso, sem explicações desnecessárias

## Restrições
- Apenas Markdown padrão
- Exemplos devem usar dados realistas (não "foo", "bar")
- Documentar erros comuns
```

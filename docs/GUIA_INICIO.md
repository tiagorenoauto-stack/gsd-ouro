# Guia de Início — GSD Ouro

## Para Quem É

O GSD Ouro foi criado para desenvolvedores que querem:
- Manter qualidade consistente usando Kit Padrão Ouro
- Economizar 80%+ dos tokens usando IAs gratuitas
- Ter métricas reais de custo, velocidade e qualidade
- Otimizar prompts automaticamente

## Primeiros Passos

### 1. Instalar
```bash
# Dentro do seu projeto:
npx gsd-ouro@latest
# Ou clonar:
git clone https://github.com/tiagorenoauto-stack/gsd-ouro.git
```

### 2. Inicializar Projeto
```
/ouro:novo-projeto
```
O sistema vai perguntar sobre seu projeto e criar a pasta `.ouro/` com tudo configurado.

### 3. Usar no Dia a Dia
```
/ouro:prompt "o que você precisa"   ← Gerador de prompts
/ouro:status                        ← Ver métricas
/ouro:planejar 1                    ← Planejar fase 1
/ouro:executar 1                    ← Executar fase 1
/ouro:verificar 1                   ← Verificar conformidade
```

### 4. Pausar e Retomar
```
/ouro:pausar                        ← Salva contexto
/ouro:retomar                       ← Carrega onde parou
```

## Conceitos Importantes

- **Kit Ouro** — Seus componentes e padrões aprovados
- **Loop MATCH→DIFF→GENERATE→UPDATE** — Todo trabalho segue este ciclo
- **Delegação multi-IA** — Claude decide, IAs gratuitas executam
- **Analytics** — Tudo é medido: custo, tempo, qualidade, performance

## Comandos Completos

Digitar `/ouro:help` para ver todos os comandos disponíveis.

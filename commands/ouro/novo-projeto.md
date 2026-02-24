# /ouro:novo-projeto — Inicializar Projeto com Kit Ouro

Quando o usuário digitar `/ouro:novo-projeto`, execute este workflow:

## Pré-requisitos
- Estar na raiz de um projeto (com package.json ou similar)
- GSD Ouro instalado globalmente

## Workflow

### ETAPA 1: Verificação
1. Verificar se `.ouro/` já existe (se sim, perguntar se quer reiniciar)
2. Verificar se é um projeto válido (tem código fonte)
3. Verificar API keys configuradas

### ETAPA 2: Perguntas ao Usuário
Pergunte de forma conversacional:
1. **Nome do projeto** (detectar do package.json se possível)
2. **Descrição curta** (1-2 frases: o que faz?)
3. **Stack técnica** (detectar automaticamente do package.json/composer.json etc)
4. **Público-alvo** (quem vai usar?)
5. **Perfil de IA** (gratuito / econômico / qualidade)

### ETAPA 3: Criar Estrutura .ouro/
```
.ouro/
├── config.json          ← configurações do projeto
├── PROJECT.md           ← visão geral (preencher com respostas)
├── REQUIREMENTS.md      ← requisitos (iniciar vazio)
├── ROADMAP.md           ← roadmap (iniciar com sugestão)
├── STATE.md             ← estado atual (sessão 0)
├── active_context.md    ← contexto ativo
├── ia-config.json       ← configuração de IAs (copiar template)
├── analytics/           ← pasta de métricas
│   └── dashboard.json   ← dashboard inicial
└── KIT_OURO.md          ← Kit específico do projeto (copiar template)
```

### ETAPA 4: Mapear Código Existente (se houver)
Se o projeto já tem código:
1. Escanear estrutura de pastas
2. Identificar componentes existentes
3. Popular KIT_OURO.md com componentes encontrados
4. Sugerir hierarquia (Módulos > Grupos > Unidades)

### ETAPA 5: Sugerir Roadmap
Baseado no que foi mapeado:
1. Sugerir fases iniciais
2. Perguntar se o usuário concorda
3. Salvar em ROADMAP.md

### ETAPA 6: Confirmação
Mostrar resumo do que foi criado e próximos passos.

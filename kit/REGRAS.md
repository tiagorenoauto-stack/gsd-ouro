# REGRAS DO KIT PADRÃO OURO

## Regra de Ouro (Imutável)

**"Toda ação de desenvolvimento DEVE começar com MATCH no KIT_OURO.md.
Se o componente existe no Kit → USAR. Se não existe → CRIAR seguindo o padrão e ADICIONAR ao Kit."**

Nenhuma IA, nenhum agente, nenhum workflow pode violar esta regra.

## Hierarquia do Projeto

```
Módulo (ex: Auth, UserArea, Admin)
  └── Grupo (ex: Login, Profile, Settings)
       └── Unidade (ex: LoginForm, AvatarUpload)
            └── Categoria (ex: Input, Button, Card)
```

## Loop de Execução

Toda tarefa segue o loop MATCH → DIFF → GENERATE → UPDATE:

1. **MATCH** — Verificar no KIT_OURO.md se componente/padrão existe
2. **DIFF** — Comparar o que existe com o que precisa
3. **GENERATE** — Gerar código seguindo padrão do Kit
4. **UPDATE** — Atualizar KIT_OURO.md se novo padrão foi criado

## Regras de Delegação Multi-IA

- **Claude (Sonnet/Opus):** Planejamento, arquitetura, verificação, debug complexo
- **IAs Econômicas:** Código boilerplate, testes, documentação, refactoring
- **NUNCA** delegar: Decisões de arquitetura, verificação de conformidade, segurança
- **SEMPRE** verificar com Claude: Código gerado por IAs econômicas em módulos críticos

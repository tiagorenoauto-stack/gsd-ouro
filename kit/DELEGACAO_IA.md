# DELEGAÇÃO DE TAREFAS ENTRE IAs

## Princípio: Claude é o Arquiteto, IAs Econômicas são Operárias

| Tarefa | IA Principal | Fallback | Justificativa |
|--------|-------------|----------|---------------|
| Planejamento de projeto | Claude Sonnet | — | Decisão estratégica |
| Arquitetura de sistema | Claude Sonnet | — | Precisa entender Kit Ouro |
| Geração de código | Codestral (grátis) | DeepSeek V3 | Volume alto |
| Verificação de padrão | Claude Sonnet | Claude Haiku | Conformidade Kit |
| Testes unitários | DeepSeek V3 (grátis) | Codestral | Tarefa mecânica |
| Documentação | Gemini 2.5 Pro (grátis) | Mistral Small | Contexto longo |
| Pesquisa de domínio | Gemini 2.5 Pro (grátis) | DeepSeek R1 | Contexto 1M |
| Refactoring | Codestral (grátis) | DeepSeek V3 | Tarefa mecânica |
| Revisão de código | Claude Haiku | Claude Sonnet | Custo-benefício |
| Debug complexo | Claude Sonnet | DeepSeek R1 | Raciocínio profundo |
| Correção bugs simples | DeepSeek V3 (grátis) | Codestral | Tarefa padrão |
| Commits e mensagens | Qualquer IA gratuita | — | Tarefa simples |

## Regras Invioláveis

1. **NUNCA** delegar decisões de arquitetura para IAs econômicas
2. **NUNCA** delegar verificação de segurança para IAs gratuitas
3. **SEMPRE** verificar com Claude código de módulos críticos (auth, pagamento, dados sensíveis)
4. **SEMPRE** registrar qual IA gerou cada artefato para rastreabilidade

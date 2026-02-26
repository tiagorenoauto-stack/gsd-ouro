# Salvaguardas (Seguranca Operacional)

## Quando Usar

- Antes de QUALQUER mudanca em codigo de producao
- Antes de commit em branch principal
- Ao tocar em modulos criticos (auth, pagamento, dados)
- Deploy ou atualizacao de dependencias

## Keywords de Trigger

`backup`, `scope`, `dependencias`, `build check`, `deploy`, `producao`, `critico`, `migration`, `auth`, `pagamento`

## O Padrao

### 5 Verificacoes Obrigatorias

| # | Verificacao | O Que Fazer | Quando |
|---|------------|------------|--------|
| 1 | Backup | `git commit` do estado atual antes de mudar | Sempre |
| 2 | Scope | Lista dos arquivos que vai tocar (aprovar antes) | Sempre |
| 3 | Dependencias | Quem importa esses arquivos? Impacto? | Mudancas em shared/ |
| 4 | Build antes | `tsc` limpo antes de comecar | Sempre |
| 5 | Build depois | `tsc` limpo depois de terminar | Sempre |

### Arquivos Proibidos (NUNCA Tocar Sem Pedir)

| Arquivo/Diretorio | Motivo |
|-------------------|--------|
| `.env` | Credenciais e secrets |
| `auth/` | Sistema de autenticacao |
| `payment/` | Sistema de pagamento |
| `package.json` | Dependencias do projeto |
| `ormconfig.ts` / `database.ts` | Configuracao de banco |
| Migrations existentes | Podem quebrar dados em producao |
| `docker-compose.yml` | Infraestrutura |
| CI/CD configs | Pipeline de deploy |

### Regra de Rollback

Antes de qualquer mudanca grande:
```bash
# 1. Backup commit
git add -A && git commit -m "[MODULE] backup: antes de [descricao]"

# 2. Anotar estado atual
# Se algo der errado:
git revert HEAD  # ou
git reset --soft HEAD~1
```

### Modulos Criticos (Sempre Claude, Qualquer Modo)

Mesmo no modo economico, estes modulos NUNCA sao delegados para IAs externas:
- Autenticacao e autorizacao
- Processamento de pagamentos
- Manipulacao de dados pessoais
- Migrations de banco de dados
- Configuracoes de seguranca

## Checklist

- [ ] Backup commit criado antes da mudanca
- [ ] Scope dos arquivos listado e aprovado
- [ ] Dependencias verificadas (quem importa?)
- [ ] Build limpo ANTES de comecar
- [ ] Build limpo DEPOIS de terminar
- [ ] Nenhum arquivo proibido tocado sem autorizacao
- [ ] Modulos criticos revisados por Claude (nao IA externa)

## IA Recomendada

- **Qualquer modo:** Salvaguardas sao verificadas por Claude SEMPRE

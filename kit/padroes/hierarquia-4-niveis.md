# Hierarquia de 4 Niveis

## Quando Usar

- Planejar estrutura de qualquer projeto novo
- Definir nomenclatura de modulos, grupos e categorias
- Configurar FastFill (precisa dos nomes corretos)
- Criar EntityLinker (precisa dos moduleIds)

## Keywords de Trigger

`modulo`, `grupo`, `unidade`, `categoria`, `hierarquia`, `estrutura`, `organizacao`, `moduleId`, `groupId`

## O Padrao

### Os 4 Niveis

```
Modulo (Sistema principal)
  └── Grupo (Area dentro do modulo)
       └── Unidade (Registro especifico)
            └── Categoria (Tipo/classificacao da unidade)
```

### Exemplo Concreto

```
Patrimonio (Modulo)
  ├── Imoveis (Grupo)
  │    ├── Apto Centro SP (Unidade)
  │    │    ├── Manutencao (Categoria)
  │    │    └── Documento (Categoria)
  │    └── Casa Cabo Frio (Unidade)
  ├── Veiculos (Grupo)
  │    └── Civic 2020 (Unidade)
  └── Crypto (Grupo)
       └── Bitcoin Wallet (Unidade)

Financeiro (Modulo)
  ├── Contas (Grupo)
  ├── Transacoes (Grupo)
  └── Debitos (Grupo)
```

### GroupIds Semanticos (Portugues, Database-level)

| Modulo | GroupIds |
|--------|---------|
| Patrimonio | `imoveis`, `veiculos`, `crypto`, `inventario` |
| Financeiro | `contas`, `transacoes`, `debitos` |
| Trading | `operacoes`, `estudos` |
| Contatos | `contatos` |
| Organizacao | `tarefas`, `compras`, `notas` |
| Servicos | `servicos`, `locacoes` |

### Nomenclatura INEGOCIAVEL

| Termo | Significado | Exemplo | NUNCA usar |
|-------|------------|---------|------------|
| Modulo | Sistema principal | Patrimonio | "area", "secao" |
| Grupo | Subdivisao do modulo | Imoveis | "tipo", "classe" |
| Unidade | Registro individual | Casa Cabo Frio | "entidade", "item" |
| Categoria | Classificacao da unidade | Manutencao | "subtipo", "tag" |

### Aplicacao Universal

Esta hierarquia se aplica em TODAS as camadas:
- **Database:** schema e tabelas
- **IA:** respostas do FastFill usam estes termos
- **Frontend:** componentes e rotas
- **EntityLinker:** referencia modulos e grupos
- **Config:** `.ouro/config.json` usa moduleId e groupId

## Checklist

- [ ] Modulo definido com nome em portugues
- [ ] Grupos definidos com groupIds semanticos
- [ ] Nomenclatura respeita os termos obrigatorios
- [ ] FastFill configurado com os moduleIds corretos
- [ ] EntityLinker usa os mesmos moduleIds

## IA Recomendada

- **Modo claude:** Claude para toda a definicao e nomenclatura
- **Modo economico:** Claude para estrutura (nomenclatura e critica), qualquer IA para implementacao

# 05 · Arquitetura

Frontend independente. Não usa arquivos, banco ou credenciais do projeto oficial em tempo de execução.

## Camadas

- `src/app`: roteamento, providers e shell.
- `src/design-system`: tokens e componentes visuais.
- `src/charts`, `src/motion`: apresentação de dados e movimento.
- `src/features`: páginas e formulários por área.
- `src/data/contracts`: modelos e comandos tipados.
- `src/data/demo`: seed, consultas derivadas, comandos puros e persistência local.
- `src/data/queries`: interface de consulta/mutação para React.
- `packages/core`: snapshot do domínio puro, revisão 8a321f9001fe; testes preservados.

Página → hook → adaptador demo → domínio → modelo de apresentação. Comando → cópia validada do estado → transação local → cache atualizado → aviso entre abas.

O armazenamento só é atualizado após o comando concluir. Erros não produzem sucesso visual. Mutações concorrentes são serializadas pelo IndexedDB. BroadcastChannel invalida o cache das outras abas. Reiniciar a demonstração afeta somente `fluxo-ui-demo` nessa origem.

## Regras

Dinheiro em centavos; datas civis tipadas; competência de cartão separada da data. Crédito não reduz conta; pagamento de fatura não duplica gasto; transferência não é renda; projeção não é saldo. Contas estrangeiras ficam fora do consolidado BRL. Livre para gastar usa o domínio original, inclusive benefício e categorias excluídas.

## Próxima integração

Substituir `loadDemo`/`dispatch` e os serviços derivados por um adaptador de API com contratos equivalentes. Não incorporar fetch ou cálculo financeiro aos componentes. O login atual é simulado e não deve ser reutilizado como autenticação de produção. Não há migração de dados reais nesta entrega.

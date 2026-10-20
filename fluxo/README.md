# Fluxo — Sistema de Gestão Financeira

O **Fluxo** é um projeto de sistema para organização e controle financeiro pessoal, desenvolvido para aplicar na prática conceitos de **Banco de Dados, SQL e desenvolvimento de software**.

O projeto está sendo utilizado como base para o **trabalho final da disciplina de Banco de Dados**, sendo desenvolvido e documentado gradualmente conforme os conteúdos estudados durante as aulas.

## Sobre o projeto

A proposta do Fluxo é centralizar informações financeiras em um único sistema, permitindo organizar e acompanhar dados como:

- Contas;
- Cartões;
- Transações;
- Parcelamentos;
- Categorias;
- Usuários;
- Movimentações financeiras;
- Outras informações relacionadas ao controle financeiro.

O banco possui uma estrutura relativamente completa, com diversas tabelas e relacionamentos necessários para representar o funcionamento do sistema.

## Estrutura

```text
fluxo/
├── database/
│   ├── schema.sql
│   └── seeds.sql
│
├── frontend/
│   ├── index.html
│   ├── css/
│   └── js/
│
├── docs/
│   ├── MER/
│   └── screenshots/
│
└── README.md
```

> A estrutura poderá ser alterada conforme o desenvolvimento do projeto.

## Banco de Dados

O arquivo `database/schema.sql` contém a estrutura principal do banco de dados do Fluxo.

Nele estão definidas as tabelas, colunas, tipos de dados, chaves primárias, chaves estrangeiras, relacionamentos e demais regras necessárias para construir o banco.

O código SQL está sendo revisado e documentado gradualmente para facilitar o entendimento de cada parte da estrutura.

Caso sejam necessários dados iniciais ou dados para testes, eles serão mantidos separadamente no arquivo `database/seeds.sql`.

## Modelo Entidade-Relacionamento

O **MER** do projeto está disponível na pasta:

```text
docs/MER/
```

O modelo representa visualmente as principais entidades do sistema e seus relacionamentos, servindo como referência para a implementação do banco de dados.

## Interface

Além do banco de dados, o Fluxo contará com uma interface para visualizar e manipular as informações do sistema.

O desenvolvimento da interface será mantido em:

```text
frontend/
```

Inicialmente, a interface será desenvolvida utilizando tecnologias web e evoluirá juntamente com o restante do projeto.

## Desenvolvimento

O projeto será desenvolvido de forma incremental.

As alterações serão registradas através de commits para manter um histórico do desenvolvimento, das correções e da evolução da estrutura do banco de dados e da aplicação.

Entre as etapas do projeto estão:

- [x] Definição inicial do banco de dados;
- [x] Criação do MER;
- [ ] Revisão e documentação do SQL;
- [ ] Organização da estrutura do banco;
- [ ] Desenvolvimento da interface;
- [ ] Integração da interface com o banco de dados;
- [ ] Testes e correções;
- [ ] Finalização do trabalho.

## Objetivo

Além de atender aos requisitos do trabalho acadêmico, o Fluxo também é utilizado como um projeto prático para aprofundar meus conhecimentos em:

- SQL;
- Modelagem de banco de dados;
- Relacionamentos entre entidades;
- Organização e documentação de projetos;
- Git e GitHub;
- Desenvolvimento de aplicações.

A intenção é continuar evoluindo o projeto conforme novos conhecimentos forem adquiridos.
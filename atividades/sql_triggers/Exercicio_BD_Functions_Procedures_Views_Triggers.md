Banco de Dados

Exercício prático: Functions, Procedures, Views e Triggers

Estudo de caso: Empório & Café Grão da Serra

------------------------------------------------------------------------

| **Estudante** |  |
|----|----|
| **Apresentação** | Aula de 02/12, com o sistema funcionando (notebook, celular ou computador do IF) |

Neste exercício vocês trabalharão em um banco de dados pronto e
implementarão nele functions, procedures, views e triggers. O objetivo é
compreender melhor e fixar esses quatro recursos. Percebendo em que
situação cada um é a escolha mais adequada. Na última questão, vocês
criarão uma interface e conectarão ao banco.

# 1. Contexto

O Empório & Café Grão da Serra é uma cafeteria que também vende produtos
coloniais para levar para casa (café em grãos, geleias, mel). Até agora
os pedidos eram anotados em comandas de papel e o estoque era conferido
“no olho”. A proprietária decidiu informatizar o atendimento e contratou
vocês para cuidar do banco de dados.

O funcionamento é o seguinte:

- Os produtos são organizados em categorias (Cafés, Bebidas geladas,
  Salgados, Doces e Empório). Cada produto pertence a uma única
  categoria, tem preço, quantidade em estoque e um estoque mínimo,
  abaixo do qual precisa ser reposto. Um produto pode ser desativado
  para sair do cardápio sem ser excluído.

- Os clientes são cadastrados com nome, CPF, e-mail e telefone, porque a
  cafeteria tem um programa de fidelidade: quem compra com frequência
  ganha desconto.

- Cada pedido é feito por um cliente e registrado por um funcionário. O
  pedido nasce com a situação ABERTO; enquanto está aberto, recebe
  itens. Ao ser pago, passa para PAGO; se houver desistência, passa para
  CANCELADO.

- Um pedido contém vários produtos e um produto aparece em vários
  pedidos. Para cada produto do pedido registra-se a quantidade e o
  preço unitário praticado naquele momento. Guardar o preço no item é
  importante: se o preço do produto mudar amanhã, os pedidos antigos não
  podem mudar de valor.

- Toda alteração de preço de um produto deve ficar registrada em um
  histórico (preço antigo, preço novo, data e usuário do banco que
  alterou), para que a gerência possa auditar os reajustes.

Vários sistemas vão usar esse mesmo banco: o aplicativo de atendimento
no balcão, o caixa e os relatórios da gerência. Por isso a proprietária
quer que as regras do negócio fiquem no próprio banco de dados: assim,
qualquer sistema que se conectar a ele seguirá as mesmas regras, sem que
cada um precise reprogramá-las.

# 2. Modelo Entidade-Relacionamento (MER)

![Modelo Entidade-Relacionamento do Grão da
Serra](Exercicio_BD_Functions_Procedures_Views_Triggers_files/media/image1.png "MER")

**Como ler a multiplicidade:** a notação é (mínimo, máximo) e fica ao
lado da entidade que está sendo contada. Exemplos:

- Uma CATEGORIA classifica de 0 a N PRODUTOS; um PRODUTO é classificado
  por exatamente 1 CATEGORIA.

- Um CLIENTE realiza de 0 a N PEDIDOS; um PEDIDO é realizado por
  exatamente 1 CLIENTE.

- Um FUNCIONARIO atende de 0 a N PEDIDOS; um PEDIDO é atendido por
  exatamente 1 FUNCIONARIO.

- Um PEDIDO contém de 1 a N PRODUTOS; um PRODUTO está contido em 0 a N
  PEDIDOS. Por ser um relacionamento N:N com atributos próprios, ele se
  torna a tabela item_pedido no modelo relacional.

- Um PRODUTO possui de 0 a N registros em HISTORICO_PRECO; cada registro
  do histórico pertence a exatamente 1 PRODUTO.

# 3. Estrutura do banco de dados

**Legenda:** campo sublinhado e em negrito = chave primária (PK); campo
seguido de asterisco (\*) = chave estrangeira (FK).

**categoria** (**<u>id_categoria</u>**, nome, descricao)

**produto** (**<u>id_produto</u>**, nome, preco, estoque,
estoque_minimo, ativo, id_categoria**\***)

**cliente** (**<u>id_cliente</u>**, nome, cpf, email, telefone,
data_cadastro)

**funcionario** (**<u>id_funcionario</u>**, nome, cargo, data_admissao)

**pedido** (**<u>id_pedido</u>**, data_pedido, status,
desconto_percentual, valor_total, id_cliente**\***,
id_funcionario**\***)

**item_pedido** (**<u>id_pedido</u>\***, **<u>id_produto</u>\***,
quantidade, preco_unitario)

**historico_preco** (**<u>id_historico</u>**, id_produto**\***,
preco_antigo, preco_novo, data_alteracao, usuario)

**Referências das chaves estrangeiras:**

- produto.id_categoria referencia categoria.id_categoria

- pedido.id_cliente referencia cliente.id_cliente

- pedido.id_funcionario referencia funcionario.id_funcionario

- item_pedido.id_pedido referencia pedido.id_pedido

- item_pedido.id_produto referencia produto.id_produto

- historico_preco.id_produto referencia produto.id_produto

## Características dos campos

**categoria**

| **Campo**    | **Tipo**     | **Características** |
|--------------|--------------|---------------------|
| id_categoria | INT          | PK, AUTO_INCREMENT  |
| nome         | VARCHAR(50)  | NOT NULL, UNIQUE    |
| descricao    | VARCHAR(150) | Opcional            |

**produto**

| **Campo** | **Tipo** | **Características** |
|----|----|----|
| id_produto | INT | PK, AUTO_INCREMENT |
| nome | VARCHAR(80) | NOT NULL |
| preco | DECIMAL(8,2) | NOT NULL. Preço de venda atual |
| estoque | INT | NOT NULL, DEFAULT 0. Quantidade disponível |
| estoque_minimo | INT | NOT NULL, DEFAULT 5. Limite para reposição |
| ativo | BOOLEAN | NOT NULL, DEFAULT TRUE. FALSE = fora do cardápio |
| id_categoria | INT | NOT NULL, FK para categoria |

**cliente**

| **Campo**     | **Tipo**     | **Características**                      |
|---------------|--------------|------------------------------------------|
| id_cliente    | INT          | PK, AUTO_INCREMENT                       |
| nome          | VARCHAR(100) | NOT NULL                                 |
| cpf           | CHAR(14)     | NOT NULL, UNIQUE. Formato 000.000.000-00 |
| email         | VARCHAR(100) | Opcional                                 |
| telefone      | VARCHAR(20)  | Opcional                                 |
| data_cadastro | DATETIME     | NOT NULL, DEFAULT CURRENT_TIMESTAMP      |

**funcionario**

| **Campo**      | **Tipo**     | **Características**                   |
|----------------|--------------|---------------------------------------|
| id_funcionario | INT          | PK, AUTO_INCREMENT                    |
| nome           | VARCHAR(100) | NOT NULL                              |
| cargo          | VARCHAR(40)  | NOT NULL. Atendente, Caixa ou Gerente |
| data_admissao  | DATE         | NOT NULL                              |

**pedido**

| **Campo** | **Tipo** | **Características** |
|----|----|----|
| id_pedido | INT | PK, AUTO_INCREMENT |
| data_pedido | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| status | ENUM | NOT NULL, DEFAULT 'ABERTO'. Valores: 'ABERTO', 'PAGO', 'CANCELADO' |
| desconto_percentual | DECIMAL(4,2) | NOT NULL, DEFAULT 0. Desconto de fidelidade aplicado (%) |
| valor_total | DECIMAL(10,2) | NOT NULL, DEFAULT 0. Valor final, preenchido quando o pedido é pago |
| id_cliente | INT | NOT NULL, FK para cliente |
| id_funcionario | INT | NOT NULL, FK para funcionario |

**item_pedido**

| **Campo**      | **Tipo**     | **Características**                            |
|----------------|--------------|------------------------------------------------|
| id_pedido      | INT          | PK (composta), FK para pedido                  |
| id_produto     | INT          | PK (composta), FK para produto                 |
| quantidade     | INT          | NOT NULL                                       |
| preco_unitario | DECIMAL(8,2) | NOT NULL. Preço do produto no momento da venda |

**historico_preco**

| **Campo**      | **Tipo**     | **Características**                            |
|----------------|--------------|------------------------------------------------|
| id_historico   | INT          | PK, AUTO_INCREMENT                             |
| id_produto     | INT          | NOT NULL, FK para produto                      |
| preco_antigo   | DECIMAL(8,2) | NOT NULL                                       |
| preco_novo     | DECIMAL(8,2) | NOT NULL                                       |
| data_alteracao | DATETIME     | NOT NULL, DEFAULT CURRENT_TIMESTAMP            |
| usuario        | VARCHAR(100) | NOT NULL. Usuário do banco que fez a alteração |

# 4. Script de criação do banco e dos dados de teste

Executem o script abaixo inteiro no MySQL Workbench. Ele cria o banco
grao_da_serra, as sete tabelas e insere dados para os testes. Como ele
começa com DROP DATABASE, vocês podem executá-lo novamente sempre que
quiserem voltar ao estado inicial (lembrem que isso apaga também o que
vocês tiverem criado; guardem as suas soluções em um arquivo .sql
separado).

> --
> =====================================================================
>
> -- Empório & Café Grão da Serra
>
> -- Script de criação do banco, das tabelas e dos dados de teste (MySQL
> 8)
>
> -- Execute o script inteiro no MySQL Workbench antes de começar.
>
> -- Pode ser executado novamente sempre que quiserem voltar ao estado
> inicial.
>
> --
> =====================================================================
>
> DROP DATABASE IF EXISTS grao_da_serra;
>
> CREATE DATABASE grao_da_serra CHARACTER SET utf8mb4 COLLATE
> utf8mb4_unicode_ci;
>
> USE grao_da_serra;
>
> --
> ---------------------------------------------------------------------
>
> -- TABELAS
>
> --
> ---------------------------------------------------------------------
>
> CREATE TABLE categoria (
>
> id_categoria INT NOT NULL AUTO_INCREMENT,
>
> nome VARCHAR(50) NOT NULL,
>
> descricao VARCHAR(150),
>
> CONSTRAINT pk_categoria PRIMARY KEY (id_categoria),
>
> CONSTRAINT uq_categoria_nome UNIQUE (nome)
>
> );
>
> CREATE TABLE produto (
>
> id_produto INT NOT NULL AUTO_INCREMENT,
>
> nome VARCHAR(80) NOT NULL,
>
> preco DECIMAL(8,2) NOT NULL,
>
> estoque INT NOT NULL DEFAULT 0,
>
> estoque_minimo INT NOT NULL DEFAULT 5,
>
> ativo BOOLEAN NOT NULL DEFAULT TRUE,
>
> id_categoria INT NOT NULL,
>
> CONSTRAINT pk_produto PRIMARY KEY (id_produto),
>
> CONSTRAINT fk_produto_categoria FOREIGN KEY (id_categoria)
>
> REFERENCES categoria (id_categoria)
>
> );
>
> CREATE TABLE cliente (
>
> id_cliente INT NOT NULL AUTO_INCREMENT,
>
> nome VARCHAR(100) NOT NULL,
>
> cpf CHAR(14) NOT NULL,
>
> email VARCHAR(100),
>
> telefone VARCHAR(20),
>
> data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
>
> CONSTRAINT pk_cliente PRIMARY KEY (id_cliente),
>
> CONSTRAINT uq_cliente_cpf UNIQUE (cpf)
>
> );
>
> CREATE TABLE funcionario (
>
> id_funcionario INT NOT NULL AUTO_INCREMENT,
>
> nome VARCHAR(100) NOT NULL,
>
> cargo VARCHAR(40) NOT NULL,
>
> data_admissao DATE NOT NULL,
>
> CONSTRAINT pk_funcionario PRIMARY KEY (id_funcionario)
>
> );
>
> CREATE TABLE pedido (
>
> id_pedido INT NOT NULL AUTO_INCREMENT,
>
> data_pedido DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
>
> status ENUM('ABERTO','PAGO','CANCELADO') NOT NULL DEFAULT 'ABERTO',
>
> desconto_percentual DECIMAL(4,2) NOT NULL DEFAULT 0,
>
> valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,
>
> id_cliente INT NOT NULL,
>
> id_funcionario INT NOT NULL,
>
> CONSTRAINT pk_pedido PRIMARY KEY (id_pedido),
>
> CONSTRAINT fk_pedido_cliente FOREIGN KEY (id_cliente)
>
> REFERENCES cliente (id_cliente),
>
> CONSTRAINT fk_pedido_funcionario FOREIGN KEY (id_funcionario)
>
> REFERENCES funcionario (id_funcionario)
>
> );
>
> CREATE TABLE item_pedido (
>
> id_pedido INT NOT NULL,
>
> id_produto INT NOT NULL,
>
> quantidade INT NOT NULL,
>
> preco_unitario DECIMAL(8,2) NOT NULL,
>
> CONSTRAINT pk_item_pedido PRIMARY KEY (id_pedido, id_produto),
>
> CONSTRAINT fk_item_pedido FOREIGN KEY (id_pedido)
>
> REFERENCES pedido (id_pedido),
>
> CONSTRAINT fk_item_produto FOREIGN KEY (id_produto)
>
> REFERENCES produto (id_produto)
>
> );
>
> CREATE TABLE historico_preco (
>
> id_historico INT NOT NULL AUTO_INCREMENT,
>
> id_produto INT NOT NULL,
>
> preco_antigo DECIMAL(8,2) NOT NULL,
>
> preco_novo DECIMAL(8,2) NOT NULL,
>
> data_alteracao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
>
> usuario VARCHAR(100) NOT NULL,
>
> CONSTRAINT pk_historico_preco PRIMARY KEY (id_historico),
>
> CONSTRAINT fk_historico_produto FOREIGN KEY (id_produto)
>
> REFERENCES produto (id_produto)
>
> );
>
> --
> ---------------------------------------------------------------------
>
> -- DADOS DE TESTE
>
> --
> ---------------------------------------------------------------------
>
> INSERT INTO categoria (id_categoria, nome, descricao) VALUES
>
> (1, 'Cafés', 'Bebidas quentes preparadas na hora'),
>
> (2, 'Bebidas geladas', 'Sucos e chás gelados'),
>
> (3, 'Salgados', 'Salgados assados servidos no balcão'),
>
> (4, 'Doces', 'Fatias de bolos, cucas e tortas'),
>
> (5, 'Empório', 'Produtos embalados para levar para casa');
>
> INSERT INTO produto (id_produto, nome, preco, estoque, estoque_minimo,
> ativo, id_categoria) VALUES
>
> ( 1, 'Café expresso', 6.00, 200, 30, TRUE, 1),
>
> ( 2, 'Cappuccino', 11.50, 120, 20, TRUE, 1),
>
> ( 3, 'Café coado na hora', 8.00, 150, 20, TRUE, 1),
>
> ( 4, 'Suco de laranja', 9.00, 40, 10, TRUE, 2),
>
> ( 5, 'Chá gelado de hibisco', 8.50, 8, 10, TRUE, 2),
>
> ( 6, 'Pão de queijo', 5.50, 60, 15, TRUE, 3),
>
> ( 7, 'Empada de palmito', 9.50, 4, 10, TRUE, 3),
>
> ( 8, 'Quiche de alho-poró', 12.00, 0, 6, TRUE, 3),
>
> ( 9, 'Cuca de banana (fatia)', 7.50, 25, 8, TRUE, 4),
>
> (10, 'Strudel de maçã', 13.00, 12, 5, TRUE, 4),
>
> (11, 'Bolo de cenoura (fatia)', 8.00, 18, 6, TRUE, 4),
>
> (12, 'Café em grãos 250 g', 34.90, 30, 8, TRUE, 5),
>
> (13, 'Geleia colonial de morango',18.00, 5, 5, TRUE, 5),
>
> (14, 'Mel silvestre 300 g', 27.00, 14, 4, TRUE, 5),
>
> (15, 'Torta alemã (fatia)', 12.50, 0, 4, FALSE, 4);
>
> INSERT INTO cliente (id_cliente, nome, cpf, email, telefone) VALUES
>
> (1, 'Ana Beatriz Schroeder', '111.111.111-11',
> 'ana.schroeder@email.com', '(47) 99111-1111'),
>
> (2, 'Rafael Linzmeyer', '222.222.222-22', 'rafael.linz@email.com',
> '(47) 99222-2222'),
>
> (3, 'Luana Pscheidt', '333.333.333-33', 'luana.pscheidt@email.com',
> '(47) 99333-3333'),
>
> (4, 'Diego Fendrich', '444.444.444-44', NULL, '(47) 99444-4444'),
>
> (5, 'Helena Rudnick', '555.555.555-55', 'helena.rudnick@email.com',
> NULL);
>
> INSERT INTO funcionario (id_funcionario, nome, cargo, data_admissao)
> VALUES
>
> (1, 'Bruno Tavares', 'Atendente', '2024-03-04'),
>
> (2, 'Sofia Grossl', 'Caixa', '2025-01-13'),
>
> (3, 'Otávio Weiss', 'Gerente', '2022-07-01');
>
> INSERT INTO pedido (id_pedido, data_pedido, status, id_cliente,
> id_funcionario) VALUES
>
> ( 1, '2026-11-03 08:20:00', 'PAGO', 1, 1),
>
> ( 2, '2026-11-03 15:45:00', 'PAGO', 2, 1),
>
> ( 3, '2026-11-04 09:10:00', 'PAGO', 1, 2),
>
> ( 4, '2026-11-05 16:30:00', 'PAGO', 3, 1),
>
> ( 5, '2026-11-06 08:05:00', 'PAGO', 1, 2),
>
> ( 6, '2026-11-07 10:50:00', 'PAGO', 2, 1),
>
> ( 7, '2026-11-07 17:15:00', 'CANCELADO', 4, 2),
>
> ( 8, '2026-11-09 08:30:00', 'PAGO', 1, 1),
>
> ( 9, '2026-11-10 14:00:00', 'ABERTO', 3, 2),
>
> (10, '2026-11-10 14:25:00', 'ABERTO', 2, 1);
>
> INSERT INTO item_pedido (id_pedido, id_produto, quantidade,
> preco_unitario) VALUES
>
> ( 1, 1, 2, 6.00), ( 1, 6, 4, 5.50),
>
> ( 2, 2, 1, 11.50), ( 2, 10, 1, 13.00),
>
> ( 3, 3, 1, 8.00), ( 3, 9, 2, 7.50), ( 3, 12, 1, 34.90),
>
> ( 4, 4, 2, 9.00), ( 4, 7, 2, 9.50),
>
> ( 5, 1, 1, 6.00), ( 5, 11, 1, 8.00),
>
> ( 6, 2, 2, 11.50), ( 6, 6, 6, 5.50), ( 6, 14, 1, 27.00),
>
> ( 7, 13, 2, 18.00),
>
> ( 8, 1, 1, 6.00), ( 8, 9, 1, 7.50),
>
> ( 9, 5, 2, 8.50), ( 9, 10, 1, 13.00),
>
> (10, 3, 2, 8.00), (10, 6, 2, 5.50);
>
> -- Valor total dos pedidos já pagos (soma dos itens; sem desconto,
>
> -- pois são anteriores ao programa de fidelidade).
>
> UPDATE pedido p
>
> SET p.valor_total = (SELECT SUM(i.quantidade \* i.preco_unitario)
>
> FROM item_pedido i
>
> WHERE i.id_pedido = p.id_pedido)
>
> WHERE p.status = 'PAGO';
>
> --
> ---------------------------------------------------------------------
>
> -- CONFERÊNCIA RÁPIDA
>
> --
> ---------------------------------------------------------------------
>
> SELECT 'categoria' AS tabela, COUNT(\*) AS registros FROM categoria
>
> UNION ALL SELECT 'produto', COUNT(\*) FROM produto
>
> UNION ALL SELECT 'cliente', COUNT(\*) FROM cliente
>
> UNION ALL SELECT 'funcionario', COUNT(\*) FROM funcionario
>
> UNION ALL SELECT 'pedido', COUNT(\*) FROM pedido
>
> UNION ALL SELECT 'item_pedido', COUNT(\*) FROM item_pedido
>
> UNION ALL SELECT 'historico_preco', COUNT(\*) FROM historico_preco;

**O que vocês encontram nos dados de teste:**

- 15 produtos em 5 categorias. Os produtos 5, 7 e 13 estão com estoque
  igual ou abaixo do mínimo, o produto 8 está esgotado e o produto 15
  está inativo.

- 5 clientes: a cliente 1 tem quatro pedidos pagos, o cliente 2 tem
  dois, a cliente 3 tem um, o cliente 4 só tem um pedido cancelado e a
  cliente 5 ainda não fez pedidos.

- 10 pedidos: sete pagos (1, 2, 3, 4, 5, 6 e 8), um cancelado (7) e dois
  abertos (9 e 10).

- A tabela historico_preco começa vazia: ela será preenchida por um dos
  triggers que vocês vão criar.

# 5. Functions

Uma function recebe parâmetros, faz um cálculo e devolve um único valor,
podendo ser usada dentro de um SELECT, de uma view, de uma procedure ou
de um trigger. Usem function quando a mesma conta ou a mesma regra
precisa aparecer em vários lugares: escrevendo uma vez só, todos os
sistemas chegam ao mesmo resultado, e se a regra mudar vocês alteram em
um único ponto.

**Dica:** se o MySQL devolver o erro 1418 ao criar a function, declarem
a característica dela logo após o RETURNS (neste exercício, READS SQL
DATA).

### Questão 1 — fn_total_pedido

**No dia a dia:** O valor de um pedido é consultado o tempo todo: o
atendente informa ao cliente, o caixa cobra, a gerência soma no
relatório. Se cada tela fizer a sua própria conta, cedo ou tarde duas
delas vão mostrar valores diferentes para o mesmo pedido.

**O que criar:** A function fn_total_pedido(p_id_pedido INT), que
retorna DECIMAL(10,2) com a soma de quantidade × preco_unitario de todos
os itens do pedido. Se o pedido não tiver itens (ou não existir), deve
retornar 0, e não NULL.

**Por que fazer assim:** A regra de cálculo fica em um único lugar. As
questões seguintes (procedure de finalização e view de pedidos) vão
reutilizar esta function em vez de repetir o SUM.

**Como testar:** SELECT fn_total_pedido(1), fn_total_pedido(3),
fn_total_pedido(99); deve retornar 34.00, 57.90 e 0.00.

### Questão 2 — fn_situacao_estoque

**No dia a dia:** O atendente não precisa saber quantas unidades existem
nem qual é o estoque mínimo; ele precisa saber se pode vender. Já o
responsável pelas compras precisa saber o que repor. Os dois olham para
a mesma classificação.

**O que criar:** A function fn_situacao_estoque(p_id_produto INT), que
retorna um texto: 'ESGOTADO' quando o estoque for zero; 'REPOR' quando o
estoque for maior que zero e menor ou igual ao estoque mínimo; 'OK' nos
demais casos.

**Por que fazer assim:** Se amanhã a proprietária decidir que 'REPOR'
passa a valer para estoque abaixo do dobro do mínimo, basta alterar a
function: o cardápio, os relatórios e a interface passam a seguir a nova
regra sem nenhuma outra mudança.

**Como testar:** SELECT nome, estoque, estoque_minimo,
fn_situacao_estoque(id_produto) FROM produto; Os produtos 5, 7 e 13
devem aparecer como REPOR, o 8 e o 15 como ESGOTADO e os demais como OK.

### Questão 3 — fn_desconto_fidelidade

**No dia a dia:** O programa de fidelidade funciona assim: cliente com 4
ou mais pedidos pagos tem 10% de desconto; com 2 ou 3 pedidos pagos, 5%;
com menos de 2, não tem desconto. Pedidos abertos e cancelados não
contam.

**O que criar:** A function fn_desconto_fidelidade(p_id_cliente INT),
que retorna DECIMAL(4,2) com o percentual de desconto do cliente (10, 5
ou 0).

**Por que fazer assim:** A política de desconto é uma regra de negócio
que muda com frequência (promoções, novas faixas). Isolada em uma
function, ela pode ser alterada sem tocar na procedure que fecha o
pedido nem em nenhum dos sistemas.

**Como testar:** SELECT nome, fn_desconto_fidelidade(id_cliente) FROM
cliente; deve retornar 10 para a cliente 1, 5 para o cliente 2 e 0 para
os clientes 3, 4 e 5.

# 6. Procedures

Uma procedure agrupa vários comandos em uma única operação, executada
com CALL. Usem procedure para operações do negócio que alteram dados e
precisam de validação: quem chama informa apenas os parâmetros, e o
banco garante que todos os passos aconteçam do jeito certo, sempre na
mesma ordem.

Nas validações, quando a operação não puder ser feita, interrompam a
procedure com SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '...', com uma
mensagem clara em português. A interface da última questão vai exibir
essas mensagens para o usuário.

### Questão 4 — sp_abrir_pedido

**No dia a dia:** O cliente chega ao balcão e o atendente inicia um novo
pedido. O aplicativo precisa receber de volta o número do pedido criado,
para adicionar os itens a ele em seguida.

**O que criar:** A procedure sp_abrir_pedido(IN p_id_cliente INT, IN
p_id_funcionario INT, OUT p_id_pedido INT), que insere um pedido para o
cliente e o funcionário informados (data e status ficam com os valores
padrão) e devolve em p_id_pedido o número gerado.

**Por que fazer assim:** O aplicativo não precisa conhecer a estrutura
da tabela pedido nem saber quais colunas têm valor padrão. Se a tabela
ganhar novas colunas, a chamada continua a mesma. O parâmetro OUT evita
uma segunda consulta para descobrir o número do pedido.

**Como testar:** CALL sp_abrir_pedido(5, 1, @novo); SELECT @novo; deve
retornar 11, e o pedido 11 deve existir com status ABERTO.

### Questão 5 — sp_adicionar_item

**No dia a dia:** O atendente adiciona produtos ao pedido. Não se pode
vender produto fora do cardápio, nem mais unidades do que existem em
estoque, nem acrescentar itens a um pedido já pago ou cancelado. E o
preço cobrado tem de ser o preço atual do produto, não um valor
digitado.

**O que criar:** A procedure sp_adicionar_item(IN p_id_pedido INT, IN
p_id_produto INT, IN p_quantidade INT), que valida e insere o item. Ela
deve recusar a operação, com mensagem própria para cada caso, quando:

- o pedido não existir ou não estiver com status ABERTO;

- o produto não existir ou estiver inativo;

- a quantidade for menor ou igual a zero;

- o estoque do produto for menor que a quantidade pedida.

Passando pelas validações, a procedure insere o item buscando o
preco_unitario diretamente na tabela produto.

**Por que fazer assim:** As validações ficam no banco, e não em cada
tela. Um sistema novo (um totem de autoatendimento, por exemplo) já
nasce respeitando as mesmas regras apenas por chamar a procedure. Além
disso, o preço nunca vem de fora, o que elimina erro de digitação e
fraude.

**Como testar:** CALL sp_adicionar_item(@novo, 2, 2); deve funcionar. Já
CALL sp_adicionar_item(1, 1, 1); (pedido pago), CALL
sp_adicionar_item(@novo, 15, 1); (produto inativo) e CALL
sp_adicionar_item(@novo, 8, 1); (sem estoque) devem devolver as
mensagens de erro de vocês.

### Questão 6 — sp_finalizar_pedido

**No dia a dia:** No caixa, o pedido é fechado: calcula-se o valor,
aplica-se o desconto de fidelidade do cliente e o pedido passa a constar
como pago.

**O que criar:** A procedure sp_finalizar_pedido(IN p_id_pedido INT).
Ela deve recusar pedidos inexistentes, pedidos que não estejam ABERTOS e
pedidos sem itens. Para os demais, deve: obter o valor bruto com
fn_total_pedido; obter o percentual com fn_desconto_fidelidade; gravar
no pedido o desconto_percentual, o valor_total já com o desconto
(arredondado para duas casas) e o status 'PAGO'.

**Por que fazer assim:** Fechar um pedido envolve vários passos que
precisam acontecer juntos. Com a procedure, o caixa faz uma única
chamada e não há como gravar o status sem gravar o valor, ou aplicar um
desconto diferente do previsto. Reparem também no reaproveitamento das
duas functions.

**Como testar:** CALL sp_finalizar_pedido(10); deve deixar o pedido 10
como PAGO, com desconto de 5.00 e valor_total de 25.65. CALL
sp_finalizar_pedido(9); deve gravar desconto 0.00 e valor_total 30.00.
Chamar novamente para o pedido 10 deve devolver erro.

### Questão 7 — sp_reajustar_precos_categoria

**No dia a dia:** O fornecedor de café aumentou os preços e a gerência
decide reajustar em 10% todos os produtos da categoria Cafés. Fazer isso
produto por produto é lento e sujeito a esquecimentos.

**O que criar:** A procedure sp_reajustar_precos_categoria(IN
p_id_categoria INT, IN p_percentual DECIMAL(5,2)), que aplica o
percentual (positivo para aumento, negativo para redução) ao preço de
todos os produtos da categoria, arredondando para duas casas. A
categoria deve existir e o percentual não pode ser menor ou igual a
-100.

**Por que fazer assim:** A gerência executa uma operação nomeada e
parametrizada, em vez de escrever um UPDATE à mão, que pode sair sem
WHERE e reajustar a loja inteira. Depois de criar o trigger da questão
14, voltem a esta procedure: cada produto reajustado deverá gerar
automaticamente uma linha no histórico.

**Como testar:** CALL sp_reajustar_precos_categoria(1, 10); deve alterar
os preços dos produtos 1, 2 e 3 para 6.60, 12.65 e 8.80.

# 7. Views

Uma view é uma consulta salva com um nome, que passa a ser usada como se
fosse uma tabela. Usem view para entregar a cada sistema (ou a cada
perfil de usuário) exatamente os dados de que ele precisa: quem consulta
não precisa conhecer os JOINs, não enxerga colunas que não deveria ver
e, se a estrutura das tabelas mudar, basta ajustar a view.

Para que a interface da última questão funcione com qualquer solução,
usem exatamente os nomes de colunas indicados em cada view.

### Questão 8 — vw_cardapio

**No dia a dia:** É a consulta que alimenta o cardápio exibido no
aplicativo do atendente (e que poderia alimentar um cardápio digital por
QR Code na mesa).

**O que criar:** A view vw_cardapio, somente com os produtos ativos, com
as colunas: id_produto, categoria (nome da categoria), produto (nome do
produto), preco e situacao (resultado de fn_situacao_estoque).

**Por que fazer assim:** O aplicativo faz apenas SELECT \* FROM
vw_cardapio, sem JOIN e sem regra. O cardápio não expõe a quantidade em
estoque nem o estoque mínimo, que são informações internas. Em um
ambiente real, o usuário de banco do aplicativo poderia ter permissão
somente sobre a view, e não sobre a tabela produto.

**Como testar:** SELECT \* FROM vw_cardapio ORDER BY categoria, produto;
deve retornar 14 linhas (o produto 15 não aparece).

### Questão 9 — vw_pedidos_detalhados

**No dia a dia:** É a tela de acompanhamento de pedidos do caixa e da
gerência: quem pediu, quem atendeu, quantos itens, quanto custou.

**O que criar:** A view vw_pedidos_detalhados, com uma linha por pedido
e as colunas: id_pedido, data_pedido, status, cliente (nome), atendente
(nome do funcionário), qtd_itens (quantidade de produtos diferentes no
pedido), valor_bruto (resultado de fn_total_pedido), desconto_percentual
e valor_total. Pedidos sem itens também devem aparecer, com qtd_itens
igual a 0.

**Por que fazer assim:** Esta consulta junta quatro tabelas e uma
agregação. Escrita uma vez na view, ela é reutilizada pelo caixa, pelos
relatórios e pela interface com um SELECT simples, e todos enxergam os
pedidos da mesma forma.

**Como testar:** SELECT \* FROM vw_pedidos_detalhados WHERE status =
'ABERTO'; Com os dados iniciais, devem aparecer os pedidos 9
(valor_bruto 30.00) e 10 (valor_bruto 27.00).

### Questão 10 — vw_produtos_para_repor

**No dia a dia:** Toda manhã, o responsável pelas compras consulta a
lista do que precisa ser reposto antes de ligar para os fornecedores.

**O que criar:** A view vw_produtos_para_repor, com os produtos ativos
cujo estoque é menor ou igual ao estoque mínimo, com as colunas:
id_produto, produto, categoria, estoque, estoque_minimo e faltam
(estoque_minimo − estoque).

**Por que fazer assim:** A view é sempre calculada sobre os dados
atuais: a lista de compras está pronta a qualquer momento, sem que
ninguém precise lembrar a condição do filtro. Ela também pode ser a
fonte de um aviso automático no sistema.

**Como testar:** SELECT \* FROM vw_produtos_para_repor; Com os dados
iniciais, devem aparecer os produtos 5, 7, 8 e 13.

### Questão 11 — vw_vendas_por_categoria

**No dia a dia:** A proprietária quer acompanhar quais categorias vendem
mais, para decidir o que ampliar no cardápio e onde fazer promoções.

**O que criar:** A view vw_vendas_por_categoria, com uma linha por
categoria e as colunas: categoria, unidades (total de unidades vendidas)
e faturamento (soma de quantidade × preco_unitario). Considerem somente
itens de pedidos com status PAGO. Categorias sem vendas devem aparecer
com zero.

**Por que fazer assim:** Relatórios gerenciais costumam ser as consultas
mais complexas do sistema. Na view, a gerência (ou uma ferramenta de BI)
consulta o resultado pronto, sem risco de alguém esquecer de filtrar os
pedidos cancelados e inflar o faturamento.

**Como testar:** SELECT \* FROM vw_vendas_por_categoria; Com os dados
iniciais: Cafés 8 unidades e 66.50; Bebidas geladas 2 e 18.00; Salgados
12 e 74.00; Doces 5 e 43.50; Empório 2 e 61.90.

# 8. Triggers

Um trigger é um bloco de código que o banco executa sozinho, antes
(BEFORE) ou depois (AFTER) de um INSERT, UPDATE ou DELETE em uma tabela.
Usem trigger para aquilo que precisa acontecer sempre, sem depender de
alguém lembrar de chamar: manter dados consistentes, registrar auditoria
e bloquear alterações indevidas, não importa de onde o comando venha
(aplicativo, Workbench ou outro sistema).

### Questão 12 — trg_item_baixa_estoque

**No dia a dia:** Vendeu, baixou. Se a baixa do estoque depender de um
segundo comando enviado pelo aplicativo, basta uma falha de conexão
entre os dois para o estoque ficar errado.

**O que criar:** O trigger trg_item_baixa_estoque, AFTER INSERT na
tabela item_pedido, que subtrai do estoque do produto a quantidade do
item inserido.

**Por que fazer assim:** A baixa passa a ser consequência automática da
inserção do item. Nenhum sistema consegue registrar uma venda sem
atualizar o estoque, e a procedure sp_adicionar_item não precisa ser
alterada.

**Como testar:** Anotem o estoque do produto 9, executem CALL
sp_adicionar_item(@novo, 9, 1); e consultem novamente: o estoque deve
ter diminuído 1 unidade.

### Questão 13 — trg_item_devolve_estoque

**No dia a dia:** O cliente desistiu de um dos produtos antes de pagar,
e o atendente remove o item do pedido. O produto volta para a vitrine e
precisa voltar para o estoque.

**O que criar:** O trigger trg_item_devolve_estoque, AFTER DELETE na
tabela item_pedido, que soma de volta ao estoque do produto a quantidade
do item removido.

**Por que fazer assim:** Junto com o trigger anterior, o estoque
acompanha os itens nos dois sentidos, automaticamente. Reparem na
diferença entre NEW (usado no INSERT) e OLD (usado no DELETE).

**Como testar:** DELETE FROM item_pedido WHERE id_pedido = @novo AND
id_produto = 9; O estoque do produto 9 deve voltar ao valor anterior.

### Questão 14 — trg_produto_historico_preco

**No dia a dia:** A gerência quer saber quando cada preço mudou, de
quanto para quanto e quem alterou. Esse registro não pode depender da
boa vontade de quem faz a alteração.

**O que criar:** O trigger trg_produto_historico_preco, AFTER UPDATE na
tabela produto, que insere uma linha em historico_preco (id_produto,
preco_antigo, preco_novo e usuario, usando CURRENT_USER()) somente
quando o preço tiver sido de fato alterado. Atualizações em outras
colunas (estoque, por exemplo) não devem gerar histórico.

**Por que fazer assim:** A auditoria é feita pelo próprio banco. Seja
pela procedure de reajuste, seja por um UPDATE direto no Workbench, a
alteração fica registrada. É assim que sistemas reais mantêm trilhas de
auditoria confiáveis.

**Como testar:** CALL sp_reajustar_precos_categoria(1, 5); A tabela
historico_preco deve ganhar três linhas (produtos 1, 2 e 3), cada uma
com o preço antigo e o novo. Em seguida, UPDATE produto SET estoque =
199 WHERE id_produto = 1; não deve gerar nova linha.

### Questão 15 — trg_pedido_bloqueia_alteracao

**No dia a dia:** Pedido pago é registro financeiro: seu valor entra no
fechamento do caixa. Pedido cancelado também é um registro encerrado.
Nenhum dos dois pode ser modificado depois, nem por engano.

**O que criar:** O trigger trg_pedido_bloqueia_alteracao, BEFORE UPDATE
na tabela pedido, que impede (com SIGNAL e mensagem em português)
qualquer alteração em pedidos cujo status atual seja 'PAGO' ou
'CANCELADO'. Pedidos abertos continuam podendo ser alterados, inclusive
para serem pagos ou cancelados.

**Por que fazer assim:** Aqui o trigger funciona como uma trava de
segurança: a regra vale até para quem acessa o banco diretamente.
Reparem que ele é BEFORE, porque precisa agir antes de a alteração ser
gravada, e que usa OLD.status, pois interessa a situação do pedido antes
da mudança.

**Como testar:** UPDATE pedido SET valor_total = 1 WHERE id_pedido = 1;
deve devolver a mensagem de erro. Já um pedido aberto deve continuar
podendo ser finalizado: CALL sp_finalizar_pedido(@novo);

# 9. Interface conectada ao banco

### Questão 16 — Interface do sistema

**No dia a dia:** Ninguém no Grão da Serra vai abrir o Workbench para
registrar um pedido. O atendente usa telas, e são as telas que acionam
tudo o que vocês construíram: as views fornecem os dados, as procedures
executam as operações e os triggers trabalham sem que a interface saiba
que eles existem.

**O que fazer:** Criem uma interface para o sistema e conectem essa
interface ao banco grao_da_serra, usando as views e as procedures das
questões anteriores. A interface pode ser uma página web, um programa de
computador ou um aplicativo de celular, na tecnologia que vocês
preferirem.

**Uso de IA:** Para criar a interface, vocês podem (e eu sugiro que o
façam) usar uma ferramenta de IA. Atenção: a IA deve ser usada apenas na
criação da interface. As functions, procedures, views e triggers, assim
como a conexão com o banco, são trabalho de vocês.

**Prompt técnico:** Usem o texto abaixo como base do pedido para a IA,
preenchendo os dois trechos entre colchetes.

> Atue como desenvolvedor(a) front-end. Crie APENAS a interface (telas,
> navegação e
>
> estilo) de um sistema de pedidos para o "Empório & Café Grão da
> Serra".
>
> TECNOLOGIA: \[informe aqui: HTML + CSS + JavaScript \| React \| Python
> Tkinter \|
>
> Java Swing \| Flutter \| outra\]
>
> CONTEXTO
>
> Já existe um banco MySQL chamado grao_da_serra. Toda a regra de
> negócio está no
>
> banco (views, functions, procedures e triggers). A interface NÃO deve
> calcular
>
> totais, descontos nem estoque: ela apenas exibe dados e aciona as
> rotinas abaixo.
>
> TELAS
>
> 1\. Cardápio
>
> \- Lista os dados da view vw_cardapio (id_produto, categoria, produto,
> preco,
>
> situacao), agrupados por categoria.
>
> \- Produtos com situacao = 'ESGOTADO' aparecem desabilitados; 'REPOR'
> recebe um
>
> aviso discreto.
>
> 2\. Novo pedido
>
> \- Seleção de cliente (tabela cliente) e de funcionário (tabela
> funcionario).
>
> \- Botão "Abrir pedido": chama sp_abrir_pedido(p_id_cliente,
> p_id_funcionario,
>
> OUT p_id_pedido) e guarda o número do pedido devolvido.
>
> \- Adicionar produto + quantidade: chama
> sp_adicionar_item(p_id_pedido,
>
> p_id_produto, p_quantidade).
>
> \- Remover item: DELETE em item_pedido (id_pedido, id_produto).
>
> \- Botão "Finalizar": chama sp_finalizar_pedido(p_id_pedido) e exibe o
> desconto
>
> aplicado e o valor total do pedido.
>
> 3\. Pedidos
>
> \- Lista a view vw_pedidos_detalhados (id_pedido, data_pedido, status,
> cliente,
>
> atendente, qtd_itens, valor_bruto, desconto_percentual, valor_total),
> com
>
> filtro por status (ABERTO, PAGO, CANCELADO).
>
> 4\. Gerência
>
> \- Produtos para repor: view vw_produtos_para_repor (id_produto,
> produto,
>
> categoria, estoque, estoque_minimo, faltam).
>
> \- Vendas por categoria: view vw_vendas_por_categoria (categoria,
> unidades,
>
> faturamento).
>
> \- Reajuste de preços: formulário com categoria e percentual, que
> chama
>
> sp_reajustar_precos_categoria(p_id_categoria, p_percentual).
>
> \- Histórico de preços: lista a tabela historico_preco.
>
> REQUISITOS TÉCNICOS
>
> \- Concentre todo o acesso a dados em UM único módulo/arquivo, com uma
> função por
>
> operação: listarCardapio(), listarClientes(), listarFuncionarios(),
>
> abrirPedido(), adicionarItem(), removerItem(), finalizarPedido(),
>
> listarPedidos(), listarProdutosParaRepor(),
> listarVendasPorCategoria(),
>
> reajustarPrecos() e listarHistoricoPrecos().
>
> \- Implemente essas funções devolvendo dados fictícios, com exatamente
> os nomes de
>
> colunas acima. NÃO implemente a conexão com o banco: eu farei essa
> parte.
>
> \- As procedures e triggers devolvem erros com mensagens em português
> (SIGNAL).
>
> Reserve um local visível da tela para exibir essas mensagens.
>
> \- Após cada operação, recarregue os dados exibidos (o estoque e a
> situação mudam
>
> no banco por causa dos triggers).
>
> \- Código organizado e comentado em português.
>
> LAYOUT
>
> \[descreva aqui a sua proposta: cores, tipografia, disposição das
> telas, se é para
>
> celular ou computador, quem vai usar (atendente no balcão? gerente?)
> etc.\]

**Personalizem o layout.** O prompt define o que a interface precisa
fazer, mas não como ela deve parecer. Essa parte é de vocês: escolham
cores, disposição das telas, tamanho dos elementos e forma de navegação
que considerarem mais adequados para este sistema e para quem vai
usá-lo. Descrevam a proposta no trecho LAYOUT do prompt e ajustem o
resultado até ficar do jeito que vocês planejaram.

**Conexão com o banco.** A forma de conectar depende da interface
escolhida, e por isso cada um de vocês vai precisar tratar a conexão de
forma personalizada:

- **Página web (HTML/JavaScript, React etc.):** o navegador não se
  conecta diretamente ao MySQL. É necessário um programa intermediário
  (por exemplo, em Node.js, PHP ou Python) que receba os pedidos da
  página, execute os comandos no banco e devolva os resultados.

- **Programa de computador (Python Tkinter, Java Swing, C# etc.):** a
  conexão é feita diretamente pelo programa, com o conector do MySQL
  para a linguagem escolhida.

- **Aplicativo de celular:** assim como a página web, precisa de um
  programa intermediário. O celular e o computador onde está o banco
  precisam estar na mesma rede, e o aplicativo deve apontar para o
  endereço IP desse computador.

Em todos os casos, a conexão substitui os dados fictícios do módulo de
acesso a dados gerado pela IA pelas chamadas reais: SELECT nas views e
CALL nas procedures.

**Descrição da conexão.** Escrevam um parágrafo descrevendo como vocês
fizeram a conexão entre a interface e o banco: qual tecnologia usaram,
que conector ou programa intermediário foi necessário, onde ficam os
dados de acesso e como a interface chama uma view e uma procedure.

# 10. Entrega e apresentação

Na aula de **02/12**, cada estudante apresentará o sistema funcionando.
Deixem tudo pronto e testado com antecedência no notebook, no celular ou
em um computador do IF, com o banco criado, os objetos instalados e a
interface conectada.

Tragam para a apresentação:

1.  um arquivo .sql com as functions, procedures, views e triggers das
    questões 1 a 15;

2.  a interface funcionando e conectada ao banco;

3.  o parágrafo descrevendo como a conexão foi feita.

-- =====================================================================
-- Empório & Café Grão da Serra
-- Script de criação do banco, das tabelas e dos dados de teste (MySQL 8)
-- Execute o script inteiro no MySQL Workbench antes de começar.
-- Pode ser executado novamente sempre que quiserem voltar ao estado inicial.
-- =====================================================================
 
DROP DATABASE IF EXISTS grao_da_serra;
CREATE DATABASE grao_da_serra CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE grao_da_serra;
 
-- ---------------------------------------------------------------------
-- TABELAS
-- ---------------------------------------------------------------------
 
CREATE TABLE categoria (
    id_categoria INT          NOT NULL AUTO_INCREMENT,
    nome         VARCHAR(50)  NOT NULL,
    descricao    VARCHAR(150),
    CONSTRAINT pk_categoria PRIMARY KEY (id_categoria),
    CONSTRAINT uq_categoria_nome UNIQUE (nome)
);
 
CREATE TABLE produto (
    id_produto     INT          NOT NULL AUTO_INCREMENT,
    nome           VARCHAR(80)  NOT NULL,
    preco          DECIMAL(8,2) NOT NULL,
    estoque        INT          NOT NULL DEFAULT 0,
    estoque_minimo INT          NOT NULL DEFAULT 5,
    ativo          BOOLEAN      NOT NULL DEFAULT TRUE,
    id_categoria   INT          NOT NULL,
    CONSTRAINT pk_produto PRIMARY KEY (id_produto),
    CONSTRAINT fk_produto_categoria FOREIGN KEY (id_categoria)
        REFERENCES categoria (id_categoria)
);
 
CREATE TABLE cliente (
    id_cliente    INT          NOT NULL AUTO_INCREMENT,
    nome          VARCHAR(100) NOT NULL,
    cpf           CHAR(14)     NOT NULL,
    email         VARCHAR(100),
    telefone      VARCHAR(20),
    data_cadastro DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_cliente PRIMARY KEY (id_cliente),
    CONSTRAINT uq_cliente_cpf UNIQUE (cpf)
);
 
CREATE TABLE funcionario (
    id_funcionario INT          NOT NULL AUTO_INCREMENT,
    nome           VARCHAR(100) NOT NULL,
    cargo          VARCHAR(40)  NOT NULL,
    data_admissao  DATE         NOT NULL,
    CONSTRAINT pk_funcionario PRIMARY KEY (id_funcionario)
);
 
CREATE TABLE pedido (
    id_pedido           INT           NOT NULL AUTO_INCREMENT,
    data_pedido         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status              ENUM('ABERTO','PAGO','CANCELADO') NOT NULL DEFAULT 'ABERTO',
    desconto_percentual DECIMAL(4,2)  NOT NULL DEFAULT 0,
    valor_total         DECIMAL(10,2) NOT NULL DEFAULT 0,
    id_cliente          INT           NOT NULL,
    id_funcionario      INT           NOT NULL,
    CONSTRAINT pk_pedido PRIMARY KEY (id_pedido),
    CONSTRAINT fk_pedido_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente (id_cliente),
    CONSTRAINT fk_pedido_funcionario FOREIGN KEY (id_funcionario)
        REFERENCES funcionario (id_funcionario)
);
 
CREATE TABLE item_pedido (
    id_pedido      INT          NOT NULL,
    id_produto     INT          NOT NULL,
    quantidade     INT          NOT NULL,
    preco_unitario DECIMAL(8,2) NOT NULL,
    CONSTRAINT pk_item_pedido PRIMARY KEY (id_pedido, id_produto),
    CONSTRAINT fk_item_pedido FOREIGN KEY (id_pedido)
        REFERENCES pedido (id_pedido),
    CONSTRAINT fk_item_produto FOREIGN KEY (id_produto)
        REFERENCES produto (id_produto)
);
 
CREATE TABLE historico_preco (
    id_historico   INT          NOT NULL AUTO_INCREMENT,
    id_produto     INT          NOT NULL,
    preco_antigo   DECIMAL(8,2) NOT NULL,
    preco_novo     DECIMAL(8,2) NOT NULL,
    data_alteracao DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usuario        VARCHAR(100) NOT NULL,
    CONSTRAINT pk_historico_preco PRIMARY KEY (id_historico),
    CONSTRAINT fk_historico_produto FOREIGN KEY (id_produto)
        REFERENCES produto (id_produto)
);
 
-- ---------------------------------------------------------------------
-- DADOS DE TESTE
-- ---------------------------------------------------------------------
 
INSERT INTO categoria (id_categoria, nome, descricao) VALUES
    (1, 'Cafés',           'Bebidas quentes preparadas na hora'),
    (2, 'Bebidas geladas', 'Sucos e chás gelados'),
    (3, 'Salgados',        'Salgados assados servidos no balcão'),
    (4, 'Doces',           'Fatias de bolos, cucas e tortas'),
    (5, 'Empório',         'Produtos embalados para levar para casa');
 
INSERT INTO produto (id_produto, nome, preco, estoque, estoque_minimo, ativo, id_categoria) VALUES
    ( 1, 'Café expresso',              6.00, 200, 30, TRUE,  1),
    ( 2, 'Cappuccino',                11.50, 120, 20, TRUE,  1),
    ( 3, 'Café coado na hora',         8.00, 150, 20, TRUE,  1),
    ( 4, 'Suco de laranja',            9.00,  40, 10, TRUE,  2),
    ( 5, 'Chá gelado de hibisco',      8.50,   8, 10, TRUE,  2),
    ( 6, 'Pão de queijo',              5.50,  60, 15, TRUE,  3),
    ( 7, 'Empada de palmito',          9.50,   4, 10, TRUE,  3),
    ( 8, 'Quiche de alho-poró',       12.00,   0,  6, TRUE,  3),
    ( 9, 'Cuca de banana (fatia)',     7.50,  25,  8, TRUE,  4),
    (10, 'Strudel de maçã',           13.00,  12,  5, TRUE,  4),
    (11, 'Bolo de cenoura (fatia)',    8.00,  18,  6, TRUE,  4),
    (12, 'Café em grãos 250 g',       34.90,  30,  8, TRUE,  5),
    (13, 'Geleia colonial de morango',18.00,   5,  5, TRUE,  5),
    (14, 'Mel silvestre 300 g',       27.00,  14,  4, TRUE,  5),
    (15, 'Torta alemã (fatia)',       12.50,   0,  4, FALSE, 4);
 
INSERT INTO cliente (id_cliente, nome, cpf, email, telefone) VALUES
    (1, 'Ana Beatriz Schroeder', '111.111.111-11', 'ana.schroeder@email.com',  '(47) 99111-1111'),
    (2, 'Rafael Linzmeyer',      '222.222.222-22', 'rafael.linz@email.com',    '(47) 99222-2222'),
    (3, 'Luana Pscheidt',        '333.333.333-33', 'luana.pscheidt@email.com', '(47) 99333-3333'),
    (4, 'Diego Fendrich',        '444.444.444-44', NULL,                       '(47) 99444-4444'),
    (5, 'Helena Rudnick',        '555.555.555-55', 'helena.rudnick@email.com', NULL);
 
INSERT INTO funcionario (id_funcionario, nome, cargo, data_admissao) VALUES
    (1, 'Bruno Tavares', 'Atendente', '2024-03-04'),
    (2, 'Sofia Grossl',  'Caixa',     '2025-01-13'),
    (3, 'Otávio Weiss',  'Gerente',   '2022-07-01');
 
INSERT INTO pedido (id_pedido, data_pedido, status, id_cliente, id_funcionario) VALUES
    ( 1, '2026-11-03 08:20:00', 'PAGO',      1, 1),
    ( 2, '2026-11-03 15:45:00', 'PAGO',      2, 1),
    ( 3, '2026-11-04 09:10:00', 'PAGO',      1, 2),
    ( 4, '2026-11-05 16:30:00', 'PAGO',      3, 1),
    ( 5, '2026-11-06 08:05:00', 'PAGO',      1, 2),
    ( 6, '2026-11-07 10:50:00', 'PAGO',      2, 1),
    ( 7, '2026-11-07 17:15:00', 'CANCELADO', 4, 2),
    ( 8, '2026-11-09 08:30:00', 'PAGO',      1, 1),
    ( 9, '2026-11-10 14:00:00', 'ABERTO',    3, 2),
    (10, '2026-11-10 14:25:00', 'ABERTO',    2, 1);
 
INSERT INTO item_pedido (id_pedido, id_produto, quantidade, preco_unitario) VALUES
    ( 1,  1, 2,  6.00), ( 1,  6, 4,  5.50),
    ( 2,  2, 1, 11.50), ( 2, 10, 1, 13.00),
    ( 3,  3, 1,  8.00), ( 3,  9, 2,  7.50), ( 3, 12, 1, 34.90),
    ( 4,  4, 2,  9.00), ( 4,  7, 2,  9.50),
    ( 5,  1, 1,  6.00), ( 5, 11, 1,  8.00),
    ( 6,  2, 2, 11.50), ( 6,  6, 6,  5.50), ( 6, 14, 1, 27.00),
    ( 7, 13, 2, 18.00),
    ( 8,  1, 1,  6.00), ( 8,  9, 1,  7.50),
    ( 9,  5, 2,  8.50), ( 9, 10, 1, 13.00),
    (10,  3, 2,  8.00), (10,  6, 2,  5.50);
 
-- Valor total dos pedidos já pagos (soma dos itens; sem desconto,
-- pois são anteriores ao programa de fidelidade).
UPDATE pedido p
   SET p.valor_total = (SELECT SUM(i.quantidade * i.preco_unitario)
                          FROM item_pedido i
                         WHERE i.id_pedido = p.id_pedido)
 WHERE p.status = 'PAGO';
 
-- ---------------------------------------------------------------------
-- CONFERÊNCIA RÁPIDA
-- ---------------------------------------------------------------------
SELECT 'categoria' AS tabela, COUNT(*) AS registros FROM categoria
UNION ALL SELECT 'produto',         COUNT(*) FROM produto
UNION ALL SELECT 'cliente',         COUNT(*) FROM cliente
UNION ALL SELECT 'funcionario',     COUNT(*) FROM funcionario
UNION ALL SELECT 'pedido',          COUNT(*) FROM pedido
UNION ALL SELECT 'item_pedido',     COUNT(*) FROM item_pedido
UNION ALL SELECT 'historico_preco', COUNT(*) FROM historico_preco;
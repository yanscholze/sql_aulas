-- =========================================================
-- SEMANA ACADÊMICA 2026 — script da base inicial (MySQL 8)
-- Pode ser executado quantas vezes quiserem: ele apaga e recria tudo.
-- No Workbench: colem tudo e executem com o raio (Ctrl+Shift+Enter).
-- =========================================================

CREATE DATABASE IF NOT EXISTS semana_academica;
USE semana_academica;

-- Desliga o "Safe Updates" do Workbench nesta conexão, para que
-- UPDATE e DELETE com WHERE em colunas que não são chave funcionem.
SET SQL_SAFE_UPDATES = 0;

-- Limpeza (tabelas filhas primeiro, inclusive as criadas nos exercícios)
DROP TABLE IF EXISTS certificado;
DROP TABLE IF EXISTS evento_patrocinador;
DROP TABLE IF EXISTS patrocinador;
DROP TABLE IF EXISTS inscricao;
DROP TABLE IF EXISTS evento;
DROP TABLE IF EXISTS participante;
DROP TABLE IF EXISTS palestrante;
DROP TABLE IF EXISTS sala;
DROP TABLE IF EXISTS curso;

-- ---------------------------------------------------------
-- Estrutura (DDL)
-- ---------------------------------------------------------
CREATE TABLE curso (
  id_curso   INT          PRIMARY KEY,
  nome       VARCHAR(80)  NOT NULL,
  sigla      VARCHAR(10)  NOT NULL UNIQUE
);

CREATE TABLE participante (
  id_participante  INT          PRIMARY KEY,
  nome             VARCHAR(80)  NOT NULL,
  email            VARCHAR(100) NOT NULL UNIQUE,
  id_curso         INT,                         -- NULL = participante externo
  cidade           VARCHAR(50)  NOT NULL,
  data_nascimento  DATE,
  FOREIGN KEY (id_curso) REFERENCES curso (id_curso)
);

CREATE TABLE palestrante (
  id_palestrante  INT          PRIMARY KEY,
  nome            VARCHAR(80)  NOT NULL,
  instituicao     VARCHAR(80)  NOT NULL,
  area            VARCHAR(60)
);

CREATE TABLE sala (
  id_sala     INT          PRIMARY KEY,
  nome        VARCHAR(60)  NOT NULL,
  bloco       CHAR(1)      NOT NULL,
  capacidade  INT          NOT NULL CHECK (capacidade > 0)
);

CREATE TABLE evento (
  id_evento       INT           PRIMARY KEY,
  titulo          VARCHAR(100)  NOT NULL,
  tipo            VARCHAR(20)   NOT NULL CHECK (tipo IN ('Palestra', 'Minicurso', 'Oficina')),
  data_evento     DATE          NOT NULL,
  hora_inicio     TIME          NOT NULL,
  carga_horaria   INT           NOT NULL,
  vagas           INT           NOT NULL,
  valor           DECIMAL(6,2)  NOT NULL DEFAULT 0,
  id_sala         INT           NOT NULL,
  id_palestrante  INT           NOT NULL,
  FOREIGN KEY (id_sala)        REFERENCES sala (id_sala),
  FOREIGN KEY (id_palestrante) REFERENCES palestrante (id_palestrante)
);

CREATE TABLE inscricao (
  id_participante  INT      NOT NULL,
  id_evento        INT      NOT NULL,
  data_inscricao   DATE     NOT NULL,
  presente         BOOLEAN  NOT NULL DEFAULT FALSE,  -- no MySQL vira TINYINT(1): 1 = TRUE, 0 = FALSE
  nota_avaliacao   INT      CHECK (nota_avaliacao BETWEEN 1 AND 5),  -- NULL = não avaliou
  PRIMARY KEY (id_participante, id_evento),
  FOREIGN KEY (id_participante) REFERENCES participante (id_participante),
  FOREIGN KEY (id_evento)       REFERENCES evento (id_evento)
);

-- ---------------------------------------------------------
-- Dados (DML)
-- ---------------------------------------------------------
INSERT INTO curso (id_curso, nome, sigla) VALUES
  (1, 'Engenharia da Computação', 'ECO'),
  (2, 'Engenharia de Controle e Automação', 'ECA'),
  (3, 'Tecnologia em Análise e Desenvolvimento de Sistemas', 'TADS'),
  (4, 'Técnico em Informática', 'TINF'),
  (5, 'Bacharelado em Design', 'DSG');

INSERT INTO participante (id_participante, nome, email, id_curso, cidade, data_nascimento) VALUES
  (1,  'Ana Beatriz Souza',  'ana.souza@email.com',      1,    'São Bento do Sul', '2004-03-12'),
  (2,  'Bruno Hoffmann',     'bruno.hoffmann@email.com', 1,    'Rio Negrinho',     '2003-07-25'),
  (3,  'Camila Schulz',      'camila.schulz@email.com',  2,    'São Bento do Sul', '2005-01-30'),
  (4,  'Diego Ramos',        'diego.ramos@email.com',    3,    'Joinville',        '2002-11-08'),
  (5,  'Eduarda Klein',      'eduarda.klein@email.com',  1,    'Campo Alegre',     '2004-09-17'),
  (6,  'Felipe Weber',       'felipe.weber@email.com',   4,    'São Bento do Sul', '2007-05-03'),
  (7,  'Gabriela Lima',      'gabriela.lima@email.com',  NULL, 'Joinville',        '1998-02-21'),
  (8,  'Henrique Bauer',     'henrique.bauer@email.com', 2,    'Rio Negrinho',     '2003-12-14'),
  (9,  'Isabela Martins',    'isabela.martins@email.com',3,    'São Bento do Sul', '2001-06-09'),
  (10, 'João Pedro Fischer', 'joao.fischer@email.com',   1,    'São Bento do Sul', '2004-10-02'),
  (11, 'Larissa Costa',      'larissa.costa@email.com',  NULL, 'Curitiba',         '1995-08-27'),
  (12, 'Mateus Krüger',      'mateus.kruger@email.com',  4,    'Campo Alegre',     '2008-01-19'),
  (13, 'Natália Rocha',      'natalia.rocha@email.com',  2,    'Joinville',        '2004-04-04'),
  (14, 'Otávio Pereira',     'otavio.pereira@email.com', 3,    'Rio Negrinho',     '2000-12-31'),
  (15, 'Paula Mendes',       'paula.mendes@email.com',   1,    'São Bento do Sul', '2005-02-15'),
  (16, 'Rafael Nunes',       'rafael.nunes@email.com',   NULL, 'Mafra',            '1999-07-07');

INSERT INTO palestrante (id_palestrante, nome, instituicao, area) VALUES
  (1, 'Helena Vieira',   'UDESC',              'Banco de Dados'),
  (2, 'Ricardo Alves',   'UFSC',               'Inteligência Artificial'),
  (3, 'Fernanda Lopes',  'TechNorte Sistemas', 'Engenharia de Software'),
  (4, 'Tiago Moreira',   'IFC',                'Automação Industrial'),
  (5, 'Sofia Andrade',   'PUCPR',              'Interação Humano-Computador'),
  (6, 'Lucas Barros',    'UTFPR',              'Redes de Computadores');

INSERT INTO sala (id_sala, nome, bloco, capacidade) VALUES
  (1, 'Auditório',                    'A', 120),
  (2, 'Laboratório de Informática 1', 'B', 30),
  (3, 'Laboratório de Informática 2', 'B', 25),
  (4, 'Sala 105',                     'A', 40),
  (5, 'Laboratório de Automação',     'C', 20);

INSERT INTO evento (id_evento, titulo, tipo, data_evento, hora_inicio, carga_horaria, vagas, valor, id_sala, id_palestrante) VALUES
  (1,  'Abertura: O futuro dos dados',            'Palestra',  '2026-11-09', '19:00', 2, 120,  0.00, 1, 1),
  (2,  'Modelagem de Bancos de Dados na Prática', 'Minicurso', '2026-11-10', '13:30', 4,  30, 25.00, 2, 1),
  (3,  'IA Generativa na Engenharia',             'Palestra',  '2026-11-10', '19:00', 2, 120,  0.00, 1, 2),
  (4,  'Python para Análise de Dados',            'Minicurso', '2026-11-11', '13:30', 4,  25, 30.00, 3, 2),
  (5,  'Métodos Ágeis no Mercado',                'Palestra',  '2026-11-11', '19:00', 2,  40, 10.00, 4, 3),
  (6,  'Git e GitHub do Zero',                    'Oficina',   '2026-11-12', '08:00', 3,  30, 15.00, 2, 3),
  (7,  'CLPs e Automação Industrial',             'Oficina',   '2026-11-12', '13:30', 3,  20, 20.00, 5, 4),
  (8,  'Prototipação de Interfaces',              'Oficina',   '2026-11-12', '19:00', 3,  25, 15.00, 3, 5),
  (9,  'Usabilidade e Acessibilidade',            'Palestra',  '2026-11-13', '10:00', 2,  50,  0.00, 4, 5),
  (10, 'SQL Avançado',                            'Minicurso', '2026-11-13', '13:30', 4,  30, 35.00, 2, 1),
  (11, 'Internet das Coisas com Arduino',         'Oficina',   '2026-11-13', '13:30', 3,  20, 25.00, 5, 4),
  (12, 'Encerramento: Carreira em Tecnologia',    'Palestra',  '2026-11-13', '19:00', 1, 120,  0.00, 1, 3);

INSERT INTO inscricao (id_participante, id_evento, data_inscricao, presente, nota_avaliacao) VALUES
  (1,  1,  '2026-10-01', TRUE,  5),
  (1,  2,  '2026-10-01', TRUE,  5),
  (1,  6,  '2026-10-05', TRUE,  4),
  (1,  10, '2026-10-05', TRUE,  4),
  (2,  1,  '2026-10-02', TRUE,  4),
  (2,  3,  '2026-10-02', TRUE,  5),
  (2,  4,  '2026-10-08', FALSE, NULL),
  (2,  6,  '2026-10-08', TRUE,  3),
  (3,  1,  '2026-10-03', TRUE,  4),
  (3,  7,  '2026-10-03', TRUE,  5),
  (3,  12, '2026-10-20', TRUE,  NULL),
  (4,  3,  '2026-10-04', TRUE,  4),
  (4,  4,  '2026-10-04', TRUE,  5),
  (4,  5,  '2026-10-10', TRUE,  4),
  (4,  10, '2026-10-10', FALSE, NULL),
  (5,  1,  '2026-10-06', TRUE,  5),
  (5,  2,  '2026-10-06', TRUE,  4),
  (5,  8,  '2026-10-12', TRUE,  5),
  (5,  9,  '2026-10-12', TRUE,  5),
  (5,  12, '2026-10-25', FALSE, NULL),
  (6,  6,  '2026-10-07', TRUE,  5),
  (6,  7,  '2026-10-07', FALSE, NULL),
  (7,  3,  '2026-10-09', TRUE,  3),
  (7,  5,  '2026-10-09', TRUE,  4),
  (7,  9,  '2026-10-15', TRUE,  4),
  (8,  1,  '2026-10-11', FALSE, NULL),
  (8,  7,  '2026-10-11', TRUE,  4),
  (8,  12, '2026-10-22', TRUE,  4),
  (9,  4,  '2026-10-13', TRUE,  4),
  (9,  5,  '2026-10-13', TRUE,  3),
  (9,  8,  '2026-10-16', TRUE,  4),
  (9,  10, '2026-10-16', TRUE,  5),
  (10, 2,  '2026-10-14', TRUE,  3),
  (10, 3,  '2026-10-14', TRUE,  5),
  (10, 6,  '2026-10-18', TRUE,  4),
  (10, 10, '2026-10-18', TRUE,  4),
  (10, 12, '2026-10-28', TRUE,  5),
  (11, 5,  '2026-10-17', TRUE,  5),
  (11, 9,  '2026-10-17', TRUE,  4),
  (12, 6,  '2026-10-19', FALSE, NULL),
  (12, 7,  '2026-10-19', TRUE,  4),
  (14, 3,  '2026-10-21', FALSE, NULL),
  (14, 4,  '2026-10-21', TRUE,  3),
  (15, 1,  '2026-10-23', TRUE,  5),
  (15, 2,  '2026-10-23', TRUE,  4),
  (15, 8,  '2026-10-24', TRUE,  4);

  -- Parte 1
  -- 1.1
CREATE TABLE certificado (
id_certificado INT PRIMARY KEY,
id_participante INT NOT NULL,
id_evento INT NOT NULL,
codigo_validacao VARCHAR(20) NOT NULL UNIQUE,
data_emissao DATE NOT NULL DEFAULT (CURRENT_DATE),
FOREIGN KEY(id_participante, id_evento)
   REFERENCES inscricao(id_participante, id_evento)
);

-- 1.2
ALTER TABLE participante
ADD COLUMN telefone VARCHAR(20);

SELECT id_participante, nome, telefone
FROM participante;
-- Os participantes sem telefone ficam com NULL, pois a coluna não é obrigatória e está vazia neles

-- 1.3
ALTER TABLE sala
ADD COLUMN possui_projetor BOOLEAN NOT NULL DEFAULT TRUE;

SELECT id_sala, nome, possui_projetor
FROM sala;
-- As salas vão vir todas com TRUE, pois estava vazio, é obrigatório, e o DEFAULT é TRUE

-- 1.4
ALTER TABLE evento
ADD CONSTRAINT ck_evento_vagas
CHECK (vagas > 0);

ALTER TABLE evento
ADD CONSTRAINT ck_evento_carga
CHECK (carga_horaria BETWEEN 1 AND 8);
-- Criar duas separadas torna mais simples a interpretação e manutenção, nomear a msm CONFIGURE REST METADATA

-- 1.5
CREATE TABLE patrocinador(
    id_patrocinador INT PRIMARY KEY,
    nome VARCHAR (80) NOT NULL,
    cnpj CHAR (14) NOT NULL UNIQUE
);
-- cria a tabela para os patrocinadores cm a primaary key
CREATE TABLE evento_patrocinador (
    id_evento INT NOT NULL,
    id_patrocinador INT NOT NULL,
    valor_aporte DECIMAL(10,2) NOT NULL,

    PRIMARY KEY (id_evento, id_patrocinador),

    FOREIGN KEY (id_evento)
        REFERENCES evento(id_evento),

    FOREIGN KEY (id_patrocinador)
        REFERENCES patrocinador(id_patrocinador),

    CHECK (valor_aporte > 0)
);
-- A chave primária é composta por id_evento e id_patrocinador.
-- No mapeamento de um relacionamento N:M, cria-se uma tabela associativa contendo as chaves das duas entidades

-- 1.6
CREATE TABLE rascunho (
    id INT PRIMARY KEY,
    texto VARCHAR(50)
);

INSERT INTO rascunho VALUES
(1, 'Teste 1'),
(2, 'Teste 2');

DROP TABLE rascunho;
-- DELETE FROM rascunho: remove registros, mas mantém a tabela. É DML.
-- TRUNCATE TABLE rascunho: remove todas as linhas rapidamente e mantém a estrutura. É tratado como DDL no MySQL.
-- DROP TABLE rascunho: remove a tabela inteira, incluindo sua estrutura. É DDL.

-- 1.7
-- DROP TABLE curso;
-- ERRO: MySQL Error (3730): Cannot drop table 'curso' referenced by a foreign key constraint 'participante_ibfk_1' on table 'participante'.
-- O DROP foi recusado pois a tabela tem chaves estrangeiras

-- (a) Se a FK tivesse ON DELETE CASCADE, excluir um REGISTRO
-- de curso também excluiria automaticamente os registros
-- dependentes relacionados por aquela FK.

-- (b) Desativar FOREIGN_KEY_CHECKS é uma má ideia porque
-- permitiria operações que podem deixar referências inválidas
-- e dados inconsistentes no banco.

-- PARTE 2 — MANIPULAÇÃO DE DADOS (DML)

-- 2.1
INSERT INTO participante
(id_participante, nome, email, id_curso, cidade, data_nascimento, telefone)
VALUES
(17, 'Yan Scholze', 'yanaugustoscholze@email.com', 1, 'São Bento do Sul', '2005-09-21', '47997390113');

-- Cadastra o participante 17 no curso de Engenharia da Computação.

-- teste
SELECT id_participante, nome, email, id_curso, cidade, data_nascimento, telefone
    FROM participante;
-- funcionou

-- 2.2
INSERT INTO inscricao
(id_participante, id_evento, data_inscricao)
VALUES
(17, 10, CURRENT_DATE),
(17, 11, CURRENT_DATE);

SELECT *
FROM inscricao
WHERE id_participante = 17;

-- presente recebe FALSE por padrão, mostrado como 0 pelo MySQL,
-- pois BOOLEAN é representado como TINYINT(1).
-- nota_avaliacao fica NULL porque não foi informado nenhum valor.


-- 2.3
INSERT INTO evento
(id_evento, titulo, tipo, data_evento, hora_inicio, carga_horaria,
 vagas, valor, id_sala, id_palestrante)
VALUES
(13, 'Banco de Dados NoSQL', 'Minicurso', '2026-11-11', '08:00:00',
 4, 30, 30.00, 2, 1);

-- Cria o evento 13 com Helena Vieira (id 1)
-- no Laboratório de Informática 1 (id 2).


-- 2.4.1
INSERT INTO evento
(id_evento, titulo, tipo, data_evento, hora_inicio, carga_horaria,
 vagas, valor, id_sala, id_palestrante)
VALUES
(14, 'Evento Teste', 'Workshop', '2026-11-12', '10:00:00',
 2, 20, 0, 1, 1);

-- Deve gerar erro de CHECK porque Workshop não é um tipo permitido.
-- MySQL Error (3819): Check constraint 'evento_chk_1' is violated.


-- 2.4.2
INSERT INTO inscricao
(id_participante, id_evento, data_inscricao)
VALUES
(1, 99, CURRENT_DATE);

-- Deve gerar erro de FOREIGN KEY porque o evento 99 não existe.
-- MySQL Error (1452): Cannot add or update a child row: a foreign key constraint fails (`semana_academica`.`inscricao`, CONSTRAINT `inscricao_ibfk_2` FOREIGN KEY (`id_evento`) REFERENCES `evento` (`id_evento`))


-- 2.4.3
INSERT INTO inscricao
(id_participante, id_evento, data_inscricao, presente, nota_avaliacao)
VALUES
(1, 3, CURRENT_DATE, TRUE, 6);

-- Deve gerar erro de CHECK porque nota_avaliacao aceita somente 1 a 5.
-- MySQL Error (3819): Check constraint 'inscricao_chk_1' is violated.


-- 2.4.4
INSERT INTO participante
(id_participante, nome, email, id_curso, cidade)
VALUES
(18, 'Participante Teste', 'ana.souza@email.com', 1, 'São Bento do Sul');

-- Deve gerar erro de UNIQUE porque o e-mail já está cadastrado.
-- MySQL Error (1062): Duplicate entry 'ana.souza@email.com' for key 'participante.email'


-- 2.4.5
INSERT INTO inscricao
(id_participante, id_evento, data_inscricao)
VALUES
(1, 1, CURRENT_DATE);

-- Deve gerar erro de PRIMARY KEY porque a inscrição (1,1) já existe.
-- MySQL Error (1062): Duplicate entry '1-1' for key 'inscricao.PRIMARY'

-- 2.5
SELECT id_evento, titulo, valor
FROM evento
WHERE tipo = 'Oficina';

UPDATE evento
SET valor = valor * 1.10
WHERE tipo = 'Oficina';

SELECT id_evento, titulo, valor
FROM evento
WHERE tipo = 'Oficina';

-- Aumenta em 10% o valor de todas as oficinas.
-- O SQL_SAFE_UPDATES existe para evitar UPDATE ou DELETE acidental
-- em muitas linhas sem uma condição segura.


-- 2.6
UPDATE inscricao
SET presente = TRUE,
    nota_avaliacao = 5
WHERE id_participante = 4
  AND id_evento = 10;

-- Registra que Diego Ramos esteve presente no SQL Avançado
-- e avaliou o evento com nota 5.


-- 2.7
UPDATE sala
SET possui_projetor = FALSE
WHERE bloco = 'C';

-- Define que todas as salas do bloco C não possuem projetor.
-- Na base atual, 1 linha é afetada.


-- 2.8
SELECT *
FROM inscricao
WHERE id_evento = 12
  AND presente = FALSE;

DELETE FROM inscricao
WHERE id_evento = 12
  AND presente = FALSE;

-- Primeiro verifica os registros e depois remove as inscrições
-- sem presença no evento 12.


-- 2.9
DELETE FROM curso
WHERE id_curso = 1;

-- O comando acima deve falhar porque existem participantes
-- relacionados ao curso através de uma FOREIGN KEY.

DELETE FROM participante
WHERE id_participante = 17;

-- Este também deve falhar porque o participante 17 possui inscrições.

DELETE FROM inscricao
WHERE id_participante = 17;

DELETE FROM participante
WHERE id_participante = 17;

-- Primeiro são removidas as inscrições dependentes e depois
-- o participante pode ser excluído sem violar a integridade referencial.


-- 2.10
INSERT INTO patrocinador
(id_patrocinador, nome, cnpj)
VALUES
(1, 'Tech Sul', '12345678000101'),
(2, 'Data Sistemas', '98765432000102');

INSERT INTO evento_patrocinador
(id_evento, id_patrocinador, valor_aporte)
VALUES
(1, 1, 1000.00),
(3, 1, 1500.00),
(6, 2, 800.00);

INSERT INTO certificado
(id_certificado, id_participante, id_evento, codigo_validacao)
SELECT
    ROW_NUMBER() OVER (ORDER BY id_participante, id_evento),
    id_participante,
    id_evento,
    CONCAT('SA26-', id_participante, '-', id_evento)
FROM inscricao
WHERE presente = TRUE;

-- INSERT INTO SELECT permite criar os certificados usando diretamente
-- os dados das inscrições presentes.
-- ROW_NUMBER gera um identificador sequencial para cada certificado.
-- CONCAT monta o código no formato SA26-participante-evento.


-- 3.1
SELECT titulo, tipo, data_evento, hora_inicio
FROM evento
ORDER BY data_evento, hora_inicio;

-- Mostra a programação em ordem cronológica.


-- 3.2
SELECT nome, cidade
FROM participante
WHERE id_curso IS NULL
ORDER BY nome;

-- IS NULL deve ser usado porque NULL representa ausência de valor.
-- "= NULL" não funciona como uma comparação comum em SQL.


-- 3.3
SELECT titulo, valor
FROM evento
WHERE valor BETWEEN 15.00 AND 30.00
ORDER BY valor DESC, titulo;

-- BETWEEN inclui os valores das duas extremidades.


-- 3.4
SELECT titulo
FROM evento
WHERE titulo LIKE '%Dados%';

SELECT titulo
FROM evento
WHERE titulo LIKE '%dados%';

SELECT titulo
FROM evento
WHERE titulo LIKE '%analise%';

SELECT titulo
FROM evento
WHERE BINARY titulo LIKE '%Dados%';

-- A collation padrão normalmente não diferencia maiúsculas de minúsculas
-- e pode também ser insensível a acentos.
-- BINARY força uma comparação que diferencia maiúsculas e minúsculas.


-- 3.5
SELECT DISTINCT cidade
FROM participante
ORDER BY cidade;

-- DISTINCT remove cidades repetidas do resultado.


-- 3.6
SELECT titulo, valor
FROM evento
ORDER BY valor DESC, titulo
LIMIT 3;

-- Retorna somente os três eventos mais caros.
-- O segundo ORDER BY garante resultado determinístico nos empates.


-- 3.7
SELECT nome, data_nascimento
FROM participante
WHERE data_nascimento >= '2004-01-01'
ORDER BY data_nascimento DESC;

-- Ordenar a data em DESC mostra os mais novos primeiro.


-- 3.8
SELECT titulo, data_evento, hora_inicio
FROM evento
WHERE valor = 0
  AND hora_inicio >= '18:00:00'
ORDER BY data_evento, hora_inicio;

-- Mostra eventos gratuitos iniciados a partir das 18h.



-- 4.1
SELECT
    e.titulo,
    e.data_evento,
    s.nome AS sala,
    s.bloco,
    p.nome AS palestrante
FROM evento e
INNER JOIN sala s
    ON e.id_sala = s.id_sala
INNER JOIN palestrante p
    ON e.id_palestrante = p.id_palestrante
ORDER BY e.data_evento, e.hora_inicio;

-- JOIN relaciona evento com sua sala e seu palestrante.


-- 4.2
SELECT
    p.nome,
    COALESCE(c.sigla, 'Externo') AS curso
FROM participante p
LEFT JOIN curso c
    ON p.id_curso = c.id_curso
ORDER BY p.nome;

-- LEFT JOIN mantém todos os participantes.
-- COALESCE troca NULL por "Externo".
-- Com INNER JOIN, os participantes sem curso desapareceriam.


-- 4.3
SELECT p.nome
FROM palestrante p
LEFT JOIN evento e
    ON p.id_palestrante = e.id_palestrante
WHERE e.id_evento IS NULL;

-- O LEFT JOIN mantém palestrantes sem evento e o IS NULL
-- identifica justamente quem não possui relacionamento.


-- 4.4
SELECT
    e.titulo,
    e.data_evento,
    e.hora_inicio,
    i.presente
FROM participante p
INNER JOIN inscricao i
    ON p.id_participante = i.id_participante
INNER JOIN evento e
    ON i.id_evento = e.id_evento
WHERE p.nome = 'Eduarda Klein'
ORDER BY e.data_evento, e.hora_inicio;

-- Mostra a agenda da Eduarda e sua presença em cada evento.


-- 4.5
SELECT
    e.titulo,
    s.nome AS sala,
    p.nome AS palestrante
FROM evento e
INNER JOIN sala s
    ON e.id_sala = s.id_sala
INNER JOIN palestrante p
    ON e.id_palestrante = p.id_palestrante
WHERE s.bloco = 'B'
ORDER BY s.nome, e.data_evento;

-- Relaciona eventos, salas e palestrantes e filtra somente o bloco B.


-- 4.6
SELECT DISTINCT
    p.nome,
    e.titulo
FROM participante p
INNER JOIN inscricao i
    ON p.id_participante = i.id_participante
INNER JOIN evento e
    ON i.id_evento = e.id_evento
WHERE p.cidade = 'Rio Negrinho'
  AND e.tipo = 'Oficina'
ORDER BY p.nome;

-- Mostra moradores de Rio Negrinho inscritos em oficinas.



-- 5.1
SELECT
    COUNT(*) AS total_participantes,
    COUNT(id_curso) AS participantes_com_curso
FROM participante;

-- COUNT(*) conta todas as linhas.
-- COUNT(id_curso) ignora os valores NULL.


-- 5.2
SELECT
    tipo,
    COUNT(*) AS quantidade,
    ROUND(AVG(valor), 2) AS valor_medio,
    MIN(valor) AS valor_minimo,
    MAX(valor) AS valor_maximo
FROM evento
GROUP BY tipo
ORDER BY valor_medio DESC;

-- Agrupa os eventos por tipo e calcula suas estatísticas.


-- 5.3
SELECT
    e.id_evento,
    e.titulo,
    COUNT(i.id_participante) AS inscritos
FROM evento e
LEFT JOIN inscricao i
    ON e.id_evento = i.id_evento
GROUP BY e.id_evento, e.titulo
ORDER BY inscritos DESC, e.titulo;

-- LEFT JOIN garante que eventos sem inscrições também apareçam.
-- COUNT da coluna da inscrição retorna zero quando não há inscritos.


-- 5.4
SELECT
    e.id_evento,
    e.titulo,
    COUNT(i.id_participante) AS inscritos
FROM evento e
LEFT JOIN inscricao i
    ON e.id_evento = i.id_evento
GROUP BY e.id_evento, e.titulo
HAVING COUNT(i.id_participante) >= 5;

-- HAVING é usado porque a condição depende do resultado do COUNT.
-- WHERE filtra linhas antes do agrupamento.


-- 5.5
SELECT
    e.id_evento,
    e.titulo,
    COUNT(i.id_participante) * e.valor AS arrecadacao
FROM evento e
INNER JOIN inscricao i
    ON e.id_evento = i.id_evento
WHERE e.valor > 0
GROUP BY e.id_evento, e.titulo, e.valor
ORDER BY arrecadacao DESC;

SELECT
    SUM(e.valor) AS arrecadacao_total
FROM inscricao i
INNER JOIN evento e
    ON i.id_evento = e.id_evento;

-- Cada inscrição contribui com o valor do respectivo evento.
-- A segunda consulta calcula a arrecadação total da Semana.


-- 5.6
SELECT
    p.nome,
    SUM(e.carga_horaria) AS total_horas
FROM participante p
INNER JOIN inscricao i
    ON p.id_participante = i.id_participante
INNER JOIN evento e
    ON i.id_evento = e.id_evento
WHERE i.presente = TRUE
GROUP BY p.id_participante, p.nome
ORDER BY total_horas DESC, p.nome;

-- Soma somente a carga horária dos eventos em que houve presença.


-- 5.7
SELECT
    p.nome AS palestrante,
    ROUND(AVG(i.nota_avaliacao), 2) AS media,
    COUNT(i.nota_avaliacao) AS quantidade_avaliacoes
FROM palestrante p
INNER JOIN evento e
    ON p.id_palestrante = e.id_palestrante
INNER JOIN inscricao i
    ON e.id_evento = i.id_evento
GROUP BY p.id_palestrante, p.nome
HAVING COUNT(i.nota_avaliacao) > 0
ORDER BY media DESC;

-- AVG ignora valores NULL.
-- Isso pode ser comprovado comparando COUNT(*) com
-- COUNT(nota_avaliacao), pois o segundo ignora NULL.


-- 5.8
SELECT
    e.titulo,
    COUNT(*) AS inscritos,
    SUM(CASE WHEN i.presente = TRUE THEN 1 ELSE 0 END) AS presentes,
    ROUND(
        SUM(CASE WHEN i.presente = TRUE THEN 1 ELSE 0 END)
        / COUNT(*) * 100,
        1
    ) AS taxa_presenca
FROM evento e
INNER JOIN inscricao i
    ON e.id_evento = i.id_evento
GROUP BY e.id_evento, e.titulo
ORDER BY taxa_presenca, e.titulo;

-- CASE transforma cada presença em 1 para que SUM possa contar.
-- A divisão entre presentes e inscritos gera a taxa percentual.


-- 5.9
SELECT
    cidade,
    COUNT(*) AS quantidade
FROM participante
GROUP BY cidade
HAVING COUNT(*) >= 3
ORDER BY quantidade DESC, cidade;

-- HAVING filtra os grupos depois da contagem.



-- 6.1
SELECT titulo, valor
FROM evento
WHERE valor > (
    SELECT AVG(valor)
    FROM evento
)
ORDER BY valor DESC;

-- A subconsulta calcula a média geral e a consulta externa
-- retorna somente os eventos acima dela.


-- 6.2 - NOT IN
SELECT nome
FROM participante
WHERE id_participante NOT IN (
    SELECT id_participante
    FROM inscricao
)
ORDER BY nome;

-- Retorna participantes cujo ID não aparece nas inscrições.


-- 6.2 - NOT EXISTS
SELECT p.nome
FROM participante p
WHERE NOT EXISTS (
    SELECT 1
    FROM inscricao i
    WHERE i.id_participante = p.id_participante
)
ORDER BY p.nome;

-- NOT EXISTS verifica se não existe inscrição relacionada
-- ao participante atual.


-- 6.3
SELECT titulo
FROM evento
WHERE id_evento NOT IN (
    SELECT id_evento
    FROM inscricao
);

-- Encontra eventos cujo ID não aparece em nenhuma inscrição.


-- 6.4
SELECT
    p.nome,
    COUNT(*) AS quantidade_inscricoes
FROM participante p
INNER JOIN inscricao i
    ON p.id_participante = i.id_participante
GROUP BY p.id_participante, p.nome
HAVING COUNT(*) = (
    SELECT MAX(total)
    FROM (
        SELECT COUNT(*) AS total
        FROM inscricao
        GROUP BY id_participante
    ) AS contagens
);

-- A tabela derivada calcula a quantidade por participante.
-- MAX encontra a maior quantidade e HAVING mantém todos os empatados.


-- 6.5
SELECT e.titulo, e.vagas
FROM evento e
WHERE e.vagas > (
    SELECT s.capacidade
    FROM sala s
    WHERE s.id_sala = e.id_sala
);

-- É correlacionada porque a subconsulta utiliza e.id_sala,
-- um valor pertencente à linha atual da consulta externa.


-- 6.6
SELECT nome
FROM participante
WHERE id_participante IN (
    SELECT id_participante
    FROM inscricao
    WHERE id_evento IN (
        SELECT id_evento
        FROM evento
        WHERE id_palestrante IN (
            SELECT id_palestrante
            FROM palestrante
            WHERE nome = 'Helena Vieira'
        )
    )
)
ORDER BY nome;

-- Foram necessários três níveis de subconsultas com IN:
-- palestrante -> evento -> inscrição -> participante.


-- 6.7
SELECT
    x.tipo,
    ROUND(AVG(x.quantidade_inscritos), 2) AS media_inscritos
FROM (
    SELECT
        e.id_evento,
        e.tipo,
        COUNT(i.id_participante) AS quantidade_inscritos
    FROM evento e
    LEFT JOIN inscricao i
        ON e.id_evento = i.id_evento
    GROUP BY e.id_evento, e.tipo
) AS x
GROUP BY x.tipo;

-- A subconsulta no FROM cria uma tabela derivada com a quantidade
-- de inscritos por evento. O LEFT JOIN inclui eventos com zero.


-- 6.8
SELECT
    p.nome,
    ROUND(AVG(i.nota_avaliacao), 2) AS media
FROM participante p
INNER JOIN inscricao i
    ON p.id_participante = i.id_participante
GROUP BY p.id_participante, p.nome
HAVING AVG(i.nota_avaliacao) > (
    SELECT AVG(nota_avaliacao)
    FROM inscricao
    WHERE nota_avaliacao IS NOT NULL
)
ORDER BY media DESC;

-- Compara a média individual com a média geral das avaliações.


-- 6.9
SELECT
    c.sigla,
    c.nome
FROM curso c
WHERE NOT EXISTS (
    SELECT 1
    FROM participante p
    WHERE p.id_curso = c.id_curso
      AND EXISTS (
          SELECT 1
          FROM inscricao i
          WHERE i.id_participante = p.id_participante
      )
);

-- O curso aparece somente quando não existe nenhum aluno desse
-- curso que possua pelo menos uma inscrição.


-- 6.10.1
UPDATE evento e
JOIN (
    SELECT
        ev.id_evento,
        COUNT(i.id_participante) AS quantidade
    FROM evento ev
    LEFT JOIN inscricao i
        ON ev.id_evento = i.id_evento
    GROUP BY ev.id_evento
    HAVING COUNT(i.id_participante) < 4
) AS poucos
    ON e.id_evento = poucos.id_evento
SET e.valor = e.valor * 0.50;

-- A tabela derivada contorna a limitação do MySQL ao modificar
-- uma tabela que também participa da seleção dos registros.
-- São encontradas 3 linhas, mas somente 2 são alteradas porque
-- um evento gratuito continua com valor 0 mesmo após 50% de desconto.


-- 6.10.2
DELETE FROM inscricao
WHERE presente = FALSE
  AND id_evento IN (
      SELECT id_evento
      FROM evento
      WHERE tipo = 'Palestra'
  );

-- Remove inscrições sem presença apenas de eventos do tipo Palestra.


-- 7.1
SELECT
    c.sigla,
    COUNT(DISTINCT p.id_participante) AS quantidade_participantes,
    COUNT(i.id_evento) AS quantidade_inscricoes,
    ROUND(AVG(i.nota_avaliacao), 2) AS media_notas
FROM curso c
LEFT JOIN participante p
    ON c.id_curso = p.id_curso
LEFT JOIN inscricao i
    ON p.id_participante = i.id_participante
GROUP BY c.id_curso, c.sigla
ORDER BY quantidade_inscricoes DESC, c.sigla;

-- LEFT JOIN mantém inclusive cursos sem participantes.
-- DISTINCT é necessário na contagem dos participantes porque um
-- participante pode possuir várias inscrições.


-- 7.2
SELECT
    s.nome AS sala,
    COALESCE(x.total_inscritos, 0) AS total_inscritos,
    COALESCE(x.total_vagas, 0) AS total_vagas,
    COALESCE(
        ROUND(x.total_inscritos / NULLIF(x.total_vagas, 0) * 100, 2),
        0
    ) AS taxa_ocupacao
FROM sala s
LEFT JOIN (
    SELECT
        e.id_sala,
        SUM(e.vagas) AS total_vagas,
        SUM(
            (SELECT COUNT(*)
             FROM inscricao i
             WHERE i.id_evento = e.id_evento)
        ) AS total_inscritos
    FROM evento e
    GROUP BY e.id_sala
) AS x
    ON s.id_sala = x.id_sala
ORDER BY taxa_ocupacao DESC, s.nome;

-- A tabela derivada calcula vagas e inscritos de todos os eventos
-- agrupados por sala.
-- A taxa é calculada dividindo inscritos pelas vagas oferecidas.


-- 7.3

-- Consulta 4.5 em álgebra relacional:
-- π titulo, sala.nome, palestrante.nome
-- (
--   σ sala.bloco = 'B'
--   (
--     evento ⋈ sala ⋈ palestrante
--   )
-- )

-- Consulta 6.2 em álgebra relacional:
-- π nome(participante)
-- -
-- π nome(participante ⋈ inscricao)

-- O NOT EXISTS corresponde à ideia de diferença de conjuntos:
-- queremos os participantes para os quais não existe uma inscrição
-- correspondente.

-- Operações como ORDER BY não fazem parte da álgebra relacional
-- básica, pois uma relação não possui uma ordem intrínseca.
-- Funções de agregação como COUNT também não são representadas
-- pelos operadores básicos de seleção, projeção, junção e diferença.

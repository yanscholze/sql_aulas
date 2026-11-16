USE grao_da_serra;
DROP FUNCTION IF EXISTS fn_situacao_estoque
DELIMITER $$

CREATE FUNCTION fn_situacao_estoque(p_id_produto INT)
RETURNS VARCHAR(20)
READS SQL DATA  
BEGIN

    DECLARE v_estoque INT;
    DECLARE v_minimo INT;
    DECLARE situacao VARCHAR(20);

    SELECT estoque, estoque_minimo
    INTO v_estoque, v_minimo
    FROM produto
    WHERE id_produto = p_id_produto;

    SELECT CASE
        WHEN v_estoque = 0 THEN 'ESGOTADO'
        WHEN v_estoque <= v_minimo THEN 'REPOR'
        ELSE 'OK'
    END
    INTO situacao;

    RETURN situacao;

END$$

DELIMITER ;
USE grao_da_serra;
DROP FUNCTION IF EXISTS fn_total_pedido;
DELIMITER $$

 CREATE FUNCTION fn_total_pedido(p_id_pedido INT)
 RETURNS DECIMAL(10,2)
 READS SQL DATA
 BEGIN

    DECLARE total DECIMAL(10,2);

    SELECT COALESCE(SUM(quantidade * preco_unitario), 0)
    INTO total
    FROM item_pedido
    WHERE id_pedido = p_id_pedido;

    RETURN total;

END$$

DELIMITER ;
USE grao_da_serra;
DROP FUNCTION IF EXISTS fn_desconto_fidelidade;
DELIMITER $$

CREATE FUNCTION fn_desconto_fidelidade(p_id_cliente INT)
RETURNS DECIMAL(4,2)    
READS SQL DATA  
BEGIN

    DECLARE n_pedidos INT;
    DECLARE desconto DECIMAL(4,2);

    SELECT COUNT(*)
    INTO n_pedidos
    FROM pedido
    WHERE id_cliente = p_id_cliente
    AND status = 'PAGO';

    SELECT CASE
        WHEN n_pedidos >= 4 THEN 10.00
        WHEN n_pedidos >= 2 THEN 5.00
        ELSE 0.00
    END
    INTO desconto;

    RETURN desconto;

END$$

DELIMITER ;
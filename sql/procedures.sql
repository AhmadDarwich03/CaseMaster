USE ticketing;


DELIMITER //

CREATE PROCEDURE create_ticket(
    IN p_problem VARCHAR(50),
    IN p_description VARCHAR(100)
)
BEGIN
    INSERT INTO users (problem, description, status)
    VALUES (p_problem, p_description, 'open');
END //

DELIMITER ;

DELIMITER //

CREATE PROCEDURE get_tickets()
BEGIN
    SELECT * FROM users;
END //

DELIMITER ;


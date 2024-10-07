USE ticketing;

DELIMITER //

CREATE PROCEDURE create_ticket(
    IN p_problem VARCHAR(50),
    IN p_description LONGTEXT,
    IN p_category VARCHAR(50)
)
BEGIN
    INSERT INTO tickets (problem, description, category, status)
    VALUES (p_problem, p_description, p_category, 'open');
END //

DELIMITER ;

DELIMITER //

CREATE PROCEDURE get_tickets()
BEGIN
    SELECT id, problem, description, category, tid, status FROM tickets;
END //

DELIMITER ;

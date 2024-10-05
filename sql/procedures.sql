USE ticketing;

DELIMITER //

CREATE PROCEDURE create_ticket(
    IN p_problem VARCHAR(50),
    IN p_description TEXT,
    IN p_department VARCHAR(50)
)
BEGIN
    INSERT INTO tickets (problem, description, department, status)
    VALUES (p_problem, p_description, p_department, 'open');
END //

DELIMITER ;

DELIMITER //

CREATE PROCEDURE get_tickets()
BEGIN
    SELECT * FROM tickets;  
END //

DELIMITER ;

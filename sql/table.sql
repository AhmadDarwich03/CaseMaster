DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS users;

CREATE TABLE users(
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) UNIQUE,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    role ENUM('user', 'admin', 'agent')
);

CREATE TABLE tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem VARCHAR(50),
    description LONGTEXT,
    category VARCHAR(50),
    tid TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20),
    imagePath VARCHAR(255),
    user_id INT
);

CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);
CREATE TABLE ticket_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    agent_id INT NOT NULL,
    action VARCHAR(255) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id),
    FOREIGN KEY (agent_id) REFERENCES users(id)
) ENGINE=InnoDB;



source procedures.sql;

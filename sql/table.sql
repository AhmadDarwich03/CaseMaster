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
    id INT AUTO_INCREMENT PRIMARY KEY,  -- Ticket ID (Primary Key)
    problem VARCHAR(50),                -- Problem title/short description
    description LONGTEXT,               -- Full description of the problem
    category VARCHAR(50),               -- Ticket category
    tid TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Timestamp when the ticket is created
    status VARCHAR(20),                 -- Status of the ticket (e.g., 'open', 'closed')
    imagePath VARCHAR(255),             -- Path to any uploaded image for the ticket
    user_id INT,                        -- ID of the user who created the ticket (Foreign Key to users table)
    claimed BOOLEAN DEFAULT FALSE       -- New column to track if the ticket is claimed (default: unclaimed)
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

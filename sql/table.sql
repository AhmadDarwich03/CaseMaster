DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS users;

CREATE TABLE users(
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    role ENUM('user', 'admin') DEFAULT 'user'
);

CREATE TABLE tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem VARCHAR(50),
    description TEXT,
    department VARCHAR(50),
    tid TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20)
);



source procedures.sql 
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,             
    problem VARCHAR(50) NOT NULL,      
    description VARCHAR(100) NOT NULL,  
    tid TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,  
    status VARCHAR(20) NOT NULL DEFAULT 'open'  
);


source procedures.sql
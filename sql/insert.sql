LOAD DATA LOCAL INFILE 'test.csv'
INTO TABLE tickets
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"' 
LINES TERMINATED BY '\n'
IGNORE 1 LINES
;
LOAD DATA LOCAL INFILE 'categori.csv'
INTO TABLE categories
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"' 
LINES TERMINATED BY '\n'
IGNORE 1 LINES
;
LOAD DATA LOCAL INFILE 'login.csv'
INTO TABLE users
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"' 
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(username, email, password, role);

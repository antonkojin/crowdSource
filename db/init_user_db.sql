CREATE USER db_user;
CREATE DATABASE db_name;
GRANT ALL PRIVILEGES ON DATABASE db_name TO db_user;

CREATE TABLE db_name.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR NOT NULL,
    password VARCHAR NOT NULL,
    type CHAR(1) -- (worker, requester)
);
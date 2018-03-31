
CREATE TYPE USER_TYPE AS ENUM ('worker', 'requester');
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    password VARCHAR NOT NULL,
    type USER_TYPE
);
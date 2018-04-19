-- users(ID, email, password, type)
-- campaigns(ID, name, )


CREATE TYPE USER_TYPE AS ENUM ('worker', 'requester');
CREATE TABLE "user" (
  id SERIAL PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  type USER_TYPE
);

CREATE TABLE campaign (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  majority_threshold INTEGER NOT NULL,
  workers_per_task INTEGER NOT NULL,
  "start" TIMESTAMP NOT NULL,
  "end" TIMESTAMP NOT NULL,
  apply_end TIMESTAMP NOT NULL,
  requester INTEGER REFERENCES "user"(id) ON DELETE SET NULL ON UPDATE CASCADE 
);

CREATE TABLE task (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  context VARCHAR NOT NULL,
  campaign INTEGER REFERENCES campaign(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE choice (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  value VARCHAR NOT NULL,
  task INTEGER REFERENCES task(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE keyword (
  id SERIAL PRIMARY KEY,
  description VARCHAR NOT NULL UNIQUE
);

CREATE TABLE task_keyword (
  task INTEGER REFERENCES task(id) ON UPDATE CASCADE,
  keyword INTEGER REFERENCES keyword(id) ON UPDATE CASCADE,
  PRIMARY KEY (task, keyword)
);

CREATE TABLE worker_attitude (
  worker INTEGER REFERENCES "user"(id) ON UPDATE CASCADE,
  keyword INTEGER REFERENCES keyword(id) ON UPDATE CASCADE,
  level INTEGER NOT NULL,
  PRIMARY KEY (worker, keyword)
);

CREATE TABLE worker_campaign (
  worker INTEGER REFERENCES "user"(id) ON UPDATE CASCADE,
  campaign INTEGER REFERENCES campaign(id) ON UPDATE CASCADE,
  PRIMARY KEY (worker, campaign)
);
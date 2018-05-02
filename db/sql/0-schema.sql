CREATE TABLE requester (
  id SERIAL PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL
);

CREATE TABLE worker (
  id SERIAL PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL
);

CREATE TABLE campaign (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  majority_threshold INTEGER NOT NULL,
  workers_per_task INTEGER NOT NULL,
  "start" TIMESTAMP NOT NULL,
  "end" TIMESTAMP NOT NULL,
  apply_end TIMESTAMP NOT NULL,
  requester INTEGER REFERENCES requester(id) ON DELETE SET NULL ON UPDATE CASCADE 
);

CREATE TABLE task (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  context VARCHAR NOT NULL,
  campaign INTEGER REFERENCES campaign(id) ON DELETE SET NULL ON UPDATE CASCADE,
  result INTEGER
);

CREATE TABLE choice (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  value VARCHAR NOT NULL,
  task INTEGER REFERENCES task(id) ON DELETE SET NULL ON UPDATE CASCADE
);
ALTER TABLE task ADD CONSTRAINT task_result_fk FOREIGN KEY (result) REFERENCES choice(id);

CREATE TABLE keyword (
  id SERIAL PRIMARY KEY,
  description VARCHAR NOT NULL UNIQUE
);

CREATE TABLE task_keyword (
  task INTEGER REFERENCES task(id) ON UPDATE CASCADE,
  keyword INTEGER REFERENCES keyword(id) ON UPDATE CASCADE,
  PRIMARY KEY (task, keyword)
);

CREATE TABLE worker_attitude ( -- TODO: check if task is valid and bla bla update score bla
  worker INTEGER REFERENCES worker(id) ON UPDATE CASCADE,
  keyword INTEGER REFERENCES keyword(id) ON UPDATE CASCADE,
  level INTEGER NOT NULL,
  PRIMARY KEY (worker, keyword)
);

CREATE TABLE worker_campaign (
  worker INTEGER REFERENCES worker(id) ON UPDATE CASCADE,
  campaign INTEGER REFERENCES campaign(id) ON UPDATE CASCADE,
  PRIMARY KEY (worker, campaign),
  score INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE worker_choice (
  worker INTEGER REFERENCES worker(id) ON UPDATE CASCADE,
  choice INTEGER REFERENCES choice(id) ON UPDATE CASCADE,
  PRIMARY KEY (worker, choice)
  -- TODO: unique(worker, choice.task) constraint
);
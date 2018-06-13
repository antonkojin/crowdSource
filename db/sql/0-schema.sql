CREATE TABLE admin (password VARCHAR NOT NULL);

CREATE TABLE requester (
  id SERIAL PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false -- TODO: should be verified by the admin, admin pw in ENV
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
  result INTEGER DEFAULT NULL
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

CREATE TABLE worker_attitude (
  worker INTEGER REFERENCES worker(id) ON UPDATE CASCADE,
  keyword INTEGER REFERENCES keyword(id) ON UPDATE CASCADE,
  level INTEGER NOT NULL DEFAULT 1,
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

CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
	"sess" json NOT NULL,
	"expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
const initOptions = {};
const pgp = require('pg-promise')(initOptions);
const connectionString = process.env.DATABASE_URL;
const db = pgp(connectionString);
const errorCodes = {
  unique_violation: 23505,
  foreign_key_violation: 23503
};

module.exports = {
  pgp,
  db,
  errorCodes
};

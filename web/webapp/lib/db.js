const { Client } = require('pg');
const client = new Client(process.env.DATABASE_URL);

client.connect()
  .then(() => console.log('db connected'))
  .catch((e) => console.error('db connection error', e.stack));

function query (query, args) {
  return client.query(query, args);
}

function testQuery() {
  query(
    'SELECT $1::text as message',
    ['Hello World!'],
    (err, res) => console.log(err ? err.stack : res.rows[0].message) // Hello World!,
  );
}

function close() {
  client.end()
    .catch(e => console.log('db disconnection error', e.stack))
    .then(() => console.log('db disconnected'));
}

module.exports = {
  query: query,
  testQuery: testQuery,
  close: close
};
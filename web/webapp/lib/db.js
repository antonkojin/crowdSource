const { Client } = require('pg');


function query(query, args) {
  const client = new Client(process.env.DATABASE_URL);
  return client.connect()
    .then(() => {
      console.log('DB CONNECTED');
      return client.query(query, args).then(result => {
        console.log('QUERY EXECUTED');
        client.end()
          .catch(e => console.log('DB DISCONNECTION ERROR', e.stack))
          .then(() => console.log('DB DISCONNECTED'));
        return result;
      });
    })
    .catch((e) => console.error('DB CONNECTION ERROR', e.stack));
}

module.exports = {
  query: query
};
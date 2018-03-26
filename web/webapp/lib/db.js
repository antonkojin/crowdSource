const { Client } = require('pg');
const client = new Client(process.env.DATABASE_URL);

client.connect()

function query (query, args, callback) {
    client.query(query, args, (err, res) => {
        callback(err, res);
    });
};

function testQuery() {
     query(
        'SELECT $1::text as message',
        ['Hello World!'],
        (err, res) => console.log(err ? err.stack : res.rows[0].message) // Hello World!,
    );
};

function login(email, password, onLogged, onNotLogged) {
    return query(
        '',
        [email, password],
        (err, res) => res.rows[0] === true ? onLogged() : onNotLogged()
    );
};

function close() {
    client.end();
}

module.exports = {
    query: query,
    testQuery: testQuery,
    login: login,
    close: close
};
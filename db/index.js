const { Pool } = require('pg');

const config = {
  user: process.env.USER_DB,
  host: process.env.HOST_DB,
  password: process.env.PASS_DB,
  database: process.env.DATA_DB,
};

const pool = new Pool(config);

module.exports = {
  async query(text, params) {
    const res = await pool.query(text, params);
    return res;
  },
  async getClient() {
    const client = await pool.connect();
    const query = client.query;
    const release = client.release;
    // set a timeout of 5 seconds, after which we will log this client's last query
    const timeout = setTimeout(() => {
      console.error('A client has been checked out for more than 5 seconds!');
      console.error(`The last executed query on this client was: ${client.lastQuery}`);
    }, 5000);
    // monkey patch the query method to keep track of the last query executed
    client.query = (...args) => {
      client.lastQuery = args;
      return query.apply(client, args);
    };
    client.release = () => {
      // clear our timeout
      clearTimeout(timeout);
      // set the methods back to their old un-monkey-patched version
      client.query = query;
      client.release = release;
      return release.apply(client);
    };
    return client;
  },
};
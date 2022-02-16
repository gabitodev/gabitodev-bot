const pgp = require('pg-promise')({
  receive: (data) => {
    camelizeColumns(data);
  },
});

const camelizeColumns = (data) => {
  const tmp = data[0];
  for (const prop in tmp) {
    const camel = pgp.utils.camelize(prop);
    if (!(camel in tmp)) {
      for (let i = 0; i < data.length; i++) {
        const d = data[i];
        d[camel] = d[prop];
        delete d[prop];
      }
    }
  }
};

const config = {
  host: process.env.HOST_DB,
  database: process.env.DATA_DB,
  user: process.env.USER_DB,
  password: process.env.PASS_DB,
  max: 30,
};

const db = pgp(config);

module.exports = db;
const db = require('./db/test');
const getScholar = async () => {
  const [team] = await db.any('select * from teams where team_id = 1');
  console.log(team);
};

getScholar();


import { db } from './index.js';

const createScholarsTable = async () => {
  db.prepare(`
  CREATE TABLE IF NOT EXISTS scholars (
    discord_id TEXT PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at TIMESTAMP NOT NULL DEFAULT (strftime('%s', 'now')),
    full_name TEXT,
    ronin_address TEXT
  );
  `).run();
  console.log('Scholars table created');
};

const createTeamsTable = async () => {
  db.prepare(`
  CREATE TABLE IF NOT EXISTS teams (
    team_id INTEGER PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at TIMESTAMP NOT NULL DEFAULT (strftime('%s', 'now')),
    renter_discord_id TEXT REFERENCES scholars(discord_id) ON DELETE SET NULL,
    ronin_address TEXT UNIQUE NOT NULL,
    daily_fee INTEGER DEFAULT 0,
    free_days INTEGER DEFAULT 0,
    last_claim DATE,
    next_claim DATE,
    in_game_slp INTEGER DEFAULT 0,
    manager_slp INTEGER DEFAULT 0,
    scholar_slp INTEGER DEFAULT 0,
    mmr INTEGER DEFAULT 1200,
    average_slp INTEGER DEFAULT 0,
    today_slp INTEGER DEFAULT 0,
    yesterday_slp INTEGER DEFAULT 0
  );
  `).run();
  console.log('Teams table created');
};

const createTrigger = async () => {
  const tables = ['scholars', 'teams'];
  for (const tableName of tables) {
    db.prepare(`
      CREATE TRIGGER set_timestamp_${tableName}
      BEFORE UPDATE ON ${tableName}
      FOR EACH ROW
      BEGIN
        UPDATE ${tableName} SET updated_at = (strftime('%s', 'now'));
      END;
    `).run();
  }
  console.log('Triggers created');
};

(async () => {
  try {
    console.log('Creating tables...');
    await createScholarsTable();
    await createTeamsTable();
    await createTrigger();
    console.log('Sucessfully created tables!');
  } catch (error) {
    console.log(error);
  }
})();
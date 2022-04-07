import { db } from './index.js';
import fs from 'fs';
import csv from 'csv-parser';

db.prepare('DELETE FROM scholars').run();
db.prepare('DELETE FROM teams').run();

fs.createReadStream('database/import-scholars.csv')
  .pipe(csv({ separator: ',' }))
  .on('data', (data) => {
    db.prepare('INSERT INTO scholars (discord_id, full_name, payout_address) VALUES (?, ?, ?)').run(data.discordId, data.fullName, data.payoutAddress);
  })
  .on('end', () => {
    console.log('CSV file for scholars successfully processed');
  });

fs.createReadStream('database/import-teams.csv')
  .pipe(csv({ separator: ',' }))
  .on('data', (data) => {
    db.prepare('INSERT INTO teams (team_id, ronin_address, daily_fee, renter_discord_id) VALUES (?, ?, ?, ?)').run(data.teamId, data.roninAddress, data.dailyFee, data.renterDiscordId);
  })
  .on('end', () => {
    console.log('CSV file for Teams successfully processed');
  });
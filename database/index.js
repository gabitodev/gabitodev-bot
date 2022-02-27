import Database from 'better-sqlite3';
const MAIN_DB = 'gabitoAxieBot.db';

export const db = new Database(MAIN_DB);
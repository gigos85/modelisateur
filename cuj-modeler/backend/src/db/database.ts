import { Database, open } from 'sqlite';
import sqlite3 from 'sqlite3';

let database: Database | null = null;

export const getDb = async (): Promise<Database> => {
  if (database) {
    return database;
  }

  database = await open({
    filename: 'data.sqlite',
    driver: sqlite3.Database
  });

  await database.exec(`
    CREATE TABLE IF NOT EXISTS cuj (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      criticity TEXT NOT NULL,
      payload TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  return database;
};

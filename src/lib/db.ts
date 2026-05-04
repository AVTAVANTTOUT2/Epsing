import Database from 'better-sqlite3';
import path from 'path';
import { env } from './env';

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    const dbPath = path.resolve(/* turbopackIgnore: true */ process.cwd(), env.DATABASE_PATH);
    _db = new Database(dbPath);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    _db.pragma('synchronous = NORMAL');
  }
  return _db;
}

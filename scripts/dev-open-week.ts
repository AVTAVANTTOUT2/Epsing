#!/usr/bin/env tsx
import path from 'path';
import { fileURLToPath } from 'url';

// Load env manually
import { config } from 'dotenv';
config({ path: path.resolve(process.cwd(), '.env.local') });

import Database from 'better-sqlite3';
import { getCurrentWeekInfo, getNextWeekInfo, toIsoString } from '../src/lib/week';

const dbPath = path.resolve(process.cwd(), process.env.DATABASE_PATH ?? './data/epsing.db');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Ensure data directory exists
import fs from 'fs';
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

// Run migrations inline
db.exec(`
  CREATE TABLE IF NOT EXISTS migrations (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, applied_at TEXT NOT NULL DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE COLLATE NOCASE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), is_active INTEGER NOT NULL DEFAULT 1);
  CREATE TABLE IF NOT EXISTS weeks (id INTEGER PRIMARY KEY AUTOINCREMENT, year INTEGER NOT NULL, iso_week INTEGER NOT NULL, voting_opens_at TEXT NOT NULL, voting_closes_at TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('upcoming','open','closed','tallied')), tallied_at TEXT, UNIQUE(year, iso_week));
  CREATE TABLE IF NOT EXISTS votes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, week_id INTEGER NOT NULL REFERENCES weeks(id) ON DELETE CASCADE, submitted_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(user_id, week_id));
  CREATE TABLE IF NOT EXISTS vote_rankings (id INTEGER PRIMARY KEY AUTOINCREMENT, vote_id INTEGER NOT NULL REFERENCES votes(id) ON DELETE CASCADE, ranked_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, position INTEGER NOT NULL CHECK(position > 0), UNIQUE(vote_id, ranked_user_id), UNIQUE(vote_id, position));
  CREATE TABLE IF NOT EXISTS weekly_scores (id INTEGER PRIMARY KEY AUTOINCREMENT, week_id INTEGER NOT NULL REFERENCES weeks(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, points INTEGER NOT NULL, rank INTEGER NOT NULL, vote_count INTEGER NOT NULL, UNIQUE(week_id, user_id));
`);

const info = getCurrentWeekInfo();
const now = new Date().toISOString();

const existing = db
  .prepare('SELECT id, status FROM weeks WHERE year = ? AND iso_week = ?')
  .get(info.year, info.isoWeek) as { id: number; status: string } | undefined;

if (!existing) {
  // Create with open status and modified voting window (now → +48h)
  const closes = new Date(Date.now() + 48 * 60 * 60 * 1000);
  db.prepare(
    `INSERT INTO weeks (year, iso_week, voting_opens_at, voting_closes_at, status) VALUES (?, ?, ?, ?, 'open')`
  ).run(info.year, info.isoWeek, now, toIsoString(closes));
  console.log(`✓ Semaine ${info.year}-W${info.isoWeek} créée et ouverte (ferme dans 48h)`);
} else if (existing.status === 'upcoming') {
  db.prepare(`UPDATE weeks SET status = 'open', voting_opens_at = ? WHERE id = ?`).run(now, existing.id);
  console.log(`✓ Semaine ${info.year}-W${info.isoWeek} (id=${existing.id}) ouverte`);
} else if (existing.status === 'open') {
  console.log(`ℹ Semaine ${info.year}-W${info.isoWeek} (id=${existing.id}) déjà ouverte`);
} else {
  // Force-open even if closed/tallied
  db.prepare(`UPDATE weeks SET status = 'open', voting_opens_at = ? WHERE id = ?`).run(now, existing.id);
  console.log(`✓ Semaine ${info.year}-W${info.isoWeek} (id=${existing.id}) forcée à 'open' (était: ${existing.status})`);
}

const week = db
  .prepare('SELECT * FROM weeks WHERE year = ? AND iso_week = ?')
  .get(info.year, info.isoWeek) as { id: number; status: string; voting_closes_at: string };
console.log(`  → id=${week.id}, status=${week.status}, ferme le ${new Date(week.voting_closes_at).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}`);

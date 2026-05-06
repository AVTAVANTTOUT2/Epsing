import { getDb } from './db';

const migrations: Array<{ id: number; name: string; sql: string }> = [
  {
    id: 1,
    name: 'initial_schema',
    sql: `
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        is_active INTEGER NOT NULL DEFAULT 1
      );
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

      CREATE TABLE IF NOT EXISTS weeks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        year INTEGER NOT NULL,
        iso_week INTEGER NOT NULL,
        voting_opens_at TEXT NOT NULL,
        voting_closes_at TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('upcoming','open','closed','tallied')),
        tallied_at TEXT,
        UNIQUE(year, iso_week)
      );
      CREATE INDEX IF NOT EXISTS idx_weeks_status ON weeks(status);

      CREATE TABLE IF NOT EXISTS votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        week_id INTEGER NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
        submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(user_id, week_id)
      );

      CREATE TABLE IF NOT EXISTS vote_rankings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vote_id INTEGER NOT NULL REFERENCES votes(id) ON DELETE CASCADE,
        ranked_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        position INTEGER NOT NULL CHECK(position > 0),
        UNIQUE(vote_id, ranked_user_id),
        UNIQUE(vote_id, position)
      );

      CREATE TABLE IF NOT EXISTS weekly_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        week_id INTEGER NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        points INTEGER NOT NULL,
        rank INTEGER NOT NULL,
        vote_count INTEGER NOT NULL,
        UNIQUE(week_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_weekly_scores_week ON weekly_scores(week_id);
      CREATE INDEX IF NOT EXISTS idx_weekly_scores_user ON weekly_scores(user_id);
    `,
  },
  {
    id: 2,
    name: '002_mvp_system',
    sql: `
      ALTER TABLE votes ADD COLUMN mvp_user_id INTEGER REFERENCES users(id);
      ALTER TABLE weekly_scores ADD COLUMN mvp_count INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE weekly_scores ADD COLUMN is_mvp INTEGER NOT NULL DEFAULT 0;
    `,
  },
  {
    id: 3,
    name: '003_matches_and_profiles',
    sql: `
      ALTER TABLE users ADD COLUMN bio TEXT;
      ALTER TABLE users ADD COLUMN play_style TEXT;
      ALTER TABLE users ADD COLUMN elo_rating INTEGER NOT NULL DEFAULT 1200;

      CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        player2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        score1 INTEGER NOT NULL,
        score2 INTEGER NOT NULL,
        elo_change1 INTEGER NOT NULL,
        elo_change2 INTEGER NOT NULL,
        played_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_matches_p1 ON matches(player1_id);
      CREATE INDEX IF NOT EXISTS idx_matches_p2 ON matches(player2_id);
    `,
  },
];

export function runMigrations(): void {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const applied = db
    .prepare('SELECT name FROM migrations')
    .all() as Array<{ name: string }>;
  const appliedNames = new Set(applied.map((r) => r.name));

  for (const migration of migrations) {
    if (!appliedNames.has(migration.name)) {
      db.exec(migration.sql);
      db.prepare('INSERT INTO migrations (id, name) VALUES (?, ?)').run(
        migration.id,
        migration.name
      );
    }
  }
}

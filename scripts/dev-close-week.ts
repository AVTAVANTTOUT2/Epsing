#!/usr/bin/env tsx
import path from 'path';
import { config } from 'dotenv';
config({ path: path.resolve(process.cwd(), '.env.local') });

import Database from 'better-sqlite3';
import { computeWeeklyScores, type Ballot } from '../src/lib/scoring';
import { getCurrentWeekInfo } from '../src/lib/week';

const dbPath = path.resolve(process.cwd(), process.env.DATABASE_PATH ?? './data/epsing.db');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

interface DbWeek {
  id: number;
  year: number;
  iso_week: number;
  status: string;
}

interface DbVoteRow {
  vote_id: number;
  voter_id: number;
  ranked_user_id: number;
  position: number;
}

// Find the open week
const openWeek = db
  .prepare(`SELECT * FROM weeks WHERE status = 'open' ORDER BY id DESC LIMIT 1`)
  .get() as DbWeek | undefined;

if (!openWeek) {
  console.error('✗ Aucune semaine ouverte. Lance d\'abord: npm run dev:open-week');
  process.exit(1);
}

console.log(`→ Clôture de la semaine ${openWeek.year}-W${openWeek.iso_week} (id=${openWeek.id})`);

// Close the week
db.prepare(`UPDATE weeks SET status = 'closed' WHERE id = ?`).run(openWeek.id);

// Get active users
const activeUsers = db
  .prepare('SELECT id, username FROM users WHERE is_active = 1 ORDER BY username ASC')
  .all() as Array<{ id: number; username: string }>;

if (activeUsers.length === 0) {
  console.log('ℹ Aucun joueur actif — semaine fermée sans classement.');
  process.exit(0);
}

const activeUserIds = activeUsers.map((u) => u.id);

// Get votes
const voteRows = db
  .prepare(
    `SELECT v.id as vote_id, v.user_id as voter_id, vr.ranked_user_id, vr.position
     FROM votes v
     JOIN vote_rankings vr ON vr.vote_id = v.id
     WHERE v.week_id = ?
     ORDER BY v.id, vr.position`
  )
  .all(openWeek.id) as DbVoteRow[];

console.log(`  ${voteRows.length > 0 ? Math.max(...voteRows.map((r) => r.vote_id)) : 0} bulletins trouvés`);

// Group into ballots
const ballotMap = new Map<number, Ballot>();
for (const row of voteRows) {
  if (!ballotMap.has(row.vote_id)) {
    ballotMap.set(row.vote_id, { voterId: row.voter_id, rankings: [] });
  }
  ballotMap.get(row.vote_id)!.rankings.push({
    userId: row.ranked_user_id,
    position: row.position,
  });
}

const ballots = Array.from(ballotMap.values());

if (ballots.length === 0) {
  db.prepare(`UPDATE weeks SET status = 'tallied', tallied_at = datetime('now') WHERE id = ?`).run(openWeek.id);
  console.log('ℹ Aucun bulletin — semaine marquée tallied sans scores.');
  process.exit(0);
}

const results = computeWeeklyScores(ballots, activeUserIds);

const insertScore = db.prepare(
  `INSERT OR REPLACE INTO weekly_scores (week_id, user_id, points, rank, vote_count)
   VALUES (?, ?, ?, ?, ?)`
);

const doTally = db.transaction(() => {
  for (const result of results) {
    insertScore.run(openWeek.id, result.userId, result.points, result.rank, result.voteCount);
  }
  db.prepare(`UPDATE weeks SET status = 'tallied', tallied_at = datetime('now') WHERE id = ?`).run(openWeek.id);
});

doTally();

console.log(`\n✓ Classement de la semaine ${openWeek.year}-W${openWeek.iso_week} :`);
console.log('─'.repeat(40));
for (const result of results) {
  const user = activeUsers.find((u) => u.id === result.userId);
  const avgPts = (result.points / 100).toFixed(2);
  console.log(`  ${result.rank}. ${user?.username.padEnd(20)} ${avgPts} pts moy.`);
}

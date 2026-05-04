import { getDb } from './db';
import { getCurrentWeekInfo, getNextWeekInfo, toIsoString } from './week';
import { computeWeeklyScores, type Ballot } from './scoring';
import type { Week } from '../types';

let cronInterval: ReturnType<typeof setInterval> | null = null;

interface DbWeek {
  id: number;
  year: number;
  iso_week: number;
  voting_opens_at: string;
  voting_closes_at: string;
  status: string;
  tallied_at: string | null;
}

interface DbVoteRow {
  vote_id: number;
  voter_id: number;
  ranked_user_id: number;
  position: number;
}

function ensureCurrentWeek(): void {
  const db = getDb();
  const info = getCurrentWeekInfo();
  const next = getNextWeekInfo();

  for (const w of [info, next]) {
    const existing = db
      .prepare('SELECT id FROM weeks WHERE year = ? AND iso_week = ?')
      .get(w.year, w.isoWeek);

    if (!existing) {
      db.prepare(
        `INSERT INTO weeks (year, iso_week, voting_opens_at, voting_closes_at, status)
         VALUES (?, ?, ?, ?, 'upcoming')`
      ).run(w.year, w.isoWeek, toIsoString(w.votingOpensAt), toIsoString(w.votingClosesAt));
      console.log(`[cron] Created week ${w.year}-W${w.isoWeek}`);
    }
  }
}

function tallyWeek(weekId: number): void {
  const db = getDb();

  // Check idempotency
  const week = db.prepare('SELECT * FROM weeks WHERE id = ?').get(weekId) as DbWeek | undefined;
  if (!week || week.status === 'tallied') return;

  // Get active users at close time
  const activeUsers = db
    .prepare('SELECT id, username FROM users WHERE is_active = 1 ORDER BY username ASC')
    .all() as Array<{ id: number; username: string }>;

  const activeUserIds = activeUsers.map((u) => u.id);

  // Get all valid votes for this week
  const voteRows = db
    .prepare(
      `SELECT v.id as vote_id, v.user_id as voter_id, vr.ranked_user_id, vr.position
       FROM votes v
       JOIN vote_rankings vr ON vr.vote_id = v.id
       WHERE v.week_id = ?
       ORDER BY v.id, vr.position`
    )
    .all(weekId) as DbVoteRow[];

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
  const results = computeWeeklyScores(ballots, activeUserIds);

  const insertScore = db.prepare(
    `INSERT OR REPLACE INTO weekly_scores (week_id, user_id, points, rank, vote_count)
     VALUES (?, ?, ?, ?, ?)`
  );

  const updateWeekStatus = db.prepare(
    `UPDATE weeks SET status = 'tallied', tallied_at = datetime('now') WHERE id = ?`
  );

  const doTally = db.transaction(() => {
    for (const result of results) {
      insertScore.run(weekId, result.userId, result.points, result.rank, result.voteCount);
    }
    updateWeekStatus.run(weekId);
  });

  doTally();
  console.log(`[cron] Tallied week ${weekId}: ${results.length} players scored`);
}

function tick(): void {
  const db = getDb();
  const now = new Date().toISOString();

  // upcoming → open
  const toOpen = db
    .prepare(
      `SELECT id FROM weeks WHERE status = 'upcoming' AND voting_opens_at <= ?`
    )
    .all(now) as Array<{ id: number }>;

  for (const { id } of toOpen) {
    db.prepare(`UPDATE weeks SET status = 'open' WHERE id = ?`).run(id);
    console.log(`[cron] Week ${id} opened`);
  }

  // open → closed + tally
  const toClose = db
    .prepare(
      `SELECT id FROM weeks WHERE status = 'open' AND voting_closes_at < ?`
    )
    .all(now) as Array<{ id: number }>;

  for (const { id } of toClose) {
    db.prepare(`UPDATE weeks SET status = 'closed' WHERE id = ?`).run(id);
    console.log(`[cron] Week ${id} closed, tallying…`);
    tallyWeek(id);
  }

  // Ensure current + next weeks exist
  ensureCurrentWeek();
}

export function startCron(): void {
  if (cronInterval) return;

  try {
    ensureCurrentWeek();
    tick();
    cronInterval = setInterval(tick, 15 * 60 * 1000); // every 15 minutes
    console.log('[cron] Started');
  } catch (e) {
    console.error('[cron] Failed to start:', e);
  }
}

export { tallyWeek, ensureCurrentWeek };

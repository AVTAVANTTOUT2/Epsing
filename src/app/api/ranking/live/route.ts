import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { weekLabel } from '@/lib/week';
import { computeWeeklyScores, type Ballot } from '@/lib/scoring';
import type { ApiResult, RankedPlayer } from '@/types';

interface DbWeek {
  id: number;
  year: number;
  iso_week: number;
  voting_opens_at: string;
  voting_closes_at: string;
  status: string;
}

interface DbScore {
  user_id: number;
  username: string;
  points: number;
  rank: number;
  vote_count: number;
}

interface DbVoteRow {
  vote_id: number;
  voter_id: number;
  ranked_user_id: number;
  position: number;
}

interface LiveRankingData {
  week: { id: number; year: number; isoWeek: number; status: string; label: string };
  players: RankedPlayer[];
  totalVotes: number;
  lowParticipation: boolean;
  isLive: boolean;
}

export async function GET(): Promise<NextResponse<ApiResult<LiveRankingData>>> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: 'Non authentifié', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const db = getDb();

  // Prefer the open week; fall back to the most recent tallied week
  const week = db
    .prepare(
      `SELECT * FROM weeks
       WHERE status IN ('open', 'tallied')
       ORDER BY CASE status WHEN 'open' THEN 0 ELSE 1 END,
                year DESC, iso_week DESC
       LIMIT 1`
    )
    .get() as DbWeek | undefined;

  if (!week) {
    return NextResponse.json(
      { ok: false, error: 'Aucun classement disponible', code: 'NO_RANKING' },
      { status: 404 }
    );
  }

  const isLive = week.status === 'open';

  // ── Tallied week: serve from cached weekly_scores ────────────────────────
  if (!isLive) {
    const scores = db
      .prepare(
        `SELECT ws.user_id, u.username, ws.points, ws.rank, ws.vote_count
         FROM weekly_scores ws
         JOIN users u ON u.id = ws.user_id
         WHERE ws.week_id = ?
         ORDER BY ws.rank ASC`
      )
      .all(week.id) as DbScore[];

    const players: RankedPlayer[] = scores.map((s) => ({
      userId: s.user_id,
      username: s.username,
      points: s.points,
      rank: s.rank,
      voteCount: s.vote_count,
    }));

    const maxVoteCount = Math.max(...scores.map((s) => s.vote_count), 0);

    return NextResponse.json({
      ok: true,
      data: {
        week: {
          id: week.id,
          year: week.year,
          isoWeek: week.iso_week,
          status: week.status,
          label: weekLabel(week.year, week.iso_week),
        },
        players,
        totalVotes: maxVoteCount,
        lowParticipation: maxVoteCount < 3,
        isLive: false,
      },
    });
  }

  // ── Open week: compute live from current votes ────────────────────────────
  const activeUsers = db
    .prepare('SELECT id, username FROM users WHERE is_active = 1 ORDER BY username ASC')
    .all() as Array<{ id: number; username: string }>;

  const activeUserIds = activeUsers.map((u) => u.id);
  const usernameMap = new Map(activeUsers.map((u) => [u.id, u.username]));

  const voteRows = db
    .prepare(
      `SELECT v.id as vote_id, v.user_id as voter_id,
              vr.ranked_user_id, vr.position
       FROM votes v
       JOIN vote_rankings vr ON vr.vote_id = v.id
       WHERE v.week_id = ?
       ORDER BY v.id, vr.position`
    )
    .all(week.id) as DbVoteRow[];

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

  const players: RankedPlayer[] = results.map((r) => ({
    userId: r.userId,
    username: usernameMap.get(r.userId) ?? String(r.userId),
    points: r.points,
    rank: r.rank,
    voteCount: r.voteCount,
  }));

  const totalVotes = ballots.length;
  const maxVoteCount = Math.max(...results.map((r) => r.voteCount), 0);

  return NextResponse.json({
    ok: true,
    data: {
      week: {
        id: week.id,
        year: week.year,
        isoWeek: week.iso_week,
        status: week.status,
        label: weekLabel(week.year, week.iso_week),
      },
      players,
      totalVotes,
      lowParticipation: maxVoteCount < 3,
      isLive: true,
    },
  });
}

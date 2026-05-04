import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import type { ApiResult, Week } from '@/types';

interface DbWeek {
  id: number;
  year: number;
  iso_week: number;
  voting_opens_at: string;
  voting_closes_at: string;
  status: string;
  tallied_at: string | null;
}

interface DbVoteRanking {
  ranked_user_id: number;
  position: number;
}

interface CurrentVoteData {
  week: Week;
  hasVoted: boolean;
  ballot: Array<{ userId: number; position: number }> | null;
}

export async function GET(): Promise<NextResponse<ApiResult<CurrentVoteData>>> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: 'Non authentifié', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const db = getDb();

  // Get current open or upcoming week
  const week = db
    .prepare(
      `SELECT * FROM weeks WHERE status IN ('open', 'upcoming', 'closed')
       ORDER BY CASE status WHEN 'open' THEN 0 WHEN 'upcoming' THEN 1 WHEN 'closed' THEN 2 END, id DESC
       LIMIT 1`
    )
    .get() as DbWeek | undefined;

  if (!week) {
    return NextResponse.json(
      { ok: false, error: 'Aucune semaine active', code: 'NO_ACTIVE_WEEK' },
      { status: 404 }
    );
  }

  const weekData: Week = {
    id: week.id,
    year: week.year,
    isoWeek: week.iso_week,
    votingOpensAt: week.voting_opens_at,
    votingClosesAt: week.voting_closes_at,
    status: week.status as Week['status'],
    talliedAt: week.tallied_at,
  };

  // Check if user already voted this week
  const vote = db
    .prepare('SELECT id FROM votes WHERE user_id = ? AND week_id = ?')
    .get(session.sub, week.id) as { id: number } | undefined;

  if (!vote) {
    return NextResponse.json({
      ok: true,
      data: { week: weekData, hasVoted: false, ballot: null },
    });
  }

  // Fetch existing ballot
  const rankings = db
    .prepare(
      'SELECT ranked_user_id, position FROM vote_rankings WHERE vote_id = ? ORDER BY position ASC'
    )
    .all(vote.id) as DbVoteRanking[];

  return NextResponse.json({
    ok: true,
    data: {
      week: weekData,
      hasVoted: true,
      ballot: rankings.map((r) => ({ userId: r.ranked_user_id, position: r.position })),
    },
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { weekLabel } from '@/lib/week';
import type { ApiResult, RankedPlayer } from '@/types';

interface DbScore {
  user_id: number;
  username: string;
  points: number;
  rank: number;
  vote_count: number;
  mvp_count: number;
  is_mvp: number;
}

interface DbWeek {
  id: number;
  year: number;
  iso_week: number;
  status: string;
  tallied_at: string | null;
}

interface WeekRankingData {
  week: { id: number; year: number; isoWeek: number; status: string; label: string };
  players: RankedPlayer[];
  lowParticipation: boolean;
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResult<WeekRankingData>>> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: 'Non authentifié', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const db = getDb();
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get('year');
  const weekParam = searchParams.get('week');

  let week: DbWeek | undefined;

  if (yearParam && weekParam) {
    week = db
      .prepare('SELECT * FROM weeks WHERE year = ? AND iso_week = ?')
      .get(parseInt(yearParam), parseInt(weekParam)) as DbWeek | undefined;
  } else {
    // Default: last tallied week
    week = db
      .prepare(`SELECT * FROM weeks WHERE status = 'tallied' ORDER BY year DESC, iso_week DESC LIMIT 1`)
      .get() as DbWeek | undefined;
  }

  if (!week) {
    return NextResponse.json(
      { ok: false, error: 'Aucun classement disponible', code: 'NO_RANKING' },
      { status: 404 }
    );
  }

  const scores = db
    .prepare(
      `SELECT ws.user_id, u.username, ws.points, ws.rank, ws.vote_count, ws.mvp_count, ws.is_mvp
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
    mvpCount: s.mvp_count,
    isMvp: Boolean(s.is_mvp),
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
      lowParticipation: maxVoteCount < 3,
    },
  });
}

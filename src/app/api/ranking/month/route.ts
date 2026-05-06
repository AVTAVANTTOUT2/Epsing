import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { getWeeksForMonth, monthLabel } from '@/lib/week';
import type { ApiResult, RankedPlayer } from '@/types';

interface DbAgg {
  user_id: number;
  username: string;
  total_points: number;
  week_count: number;
  total_mvp_stars: number;
}

interface MonthRankingData {
  label: string;
  year: number;
  month: number;
  players: RankedPlayer[];
  weekCount: number;
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResult<MonthRankingData>>> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: 'Non authentifié', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const year = parseInt(searchParams.get('year') ?? String(now.getFullYear()));
  const month = parseInt(searchParams.get('month') ?? String(now.getMonth() + 1));

  const weeks = getWeeksForMonth(year, month);
  if (weeks.length === 0) {
    return NextResponse.json(
      { ok: false, error: 'Aucune semaine pour ce mois', code: 'NO_WEEKS' },
      { status: 404 }
    );
  }

  const db = getDb();

  // Get week IDs that are tallied and in the requested month
  const weekIds: number[] = [];
  for (const { year: wy, isoWeek } of weeks) {
    const row = db
      .prepare(`SELECT id FROM weeks WHERE year = ? AND iso_week = ? AND status = 'tallied'`)
      .get(wy, isoWeek) as { id: number } | undefined;
    if (row) weekIds.push(row.id);
  }

  if (weekIds.length === 0) {
    return NextResponse.json({
      ok: true,
      data: {
        label: monthLabel(year, month),
        year,
        month,
        players: [],
        weekCount: 0,
      },
    });
  }

  const placeholders = weekIds.map(() => '?').join(',');
  const rows = db
    .prepare(
      `SELECT ws.user_id, u.username,
              SUM(ws.points) as total_points,
              COUNT(*) as week_count,
              SUM(ws.is_mvp) as total_mvp_stars
       FROM weekly_scores ws
       JOIN users u ON u.id = ws.user_id
       WHERE ws.week_id IN (${placeholders})
       GROUP BY ws.user_id
       ORDER BY total_points DESC`
    )
    .all(...weekIds) as DbAgg[];

  const players: RankedPlayer[] = rows.map((r, index) => ({
    userId: r.user_id,
    username: r.username,
    points: r.total_points,
    rank: index + 1,
    voteCount: r.week_count,
    mvpCount: r.total_mvp_stars,
    isMvp: r.total_mvp_stars > 0,
  }));

  return NextResponse.json({
    ok: true,
    data: {
      label: monthLabel(year, month),
      year,
      month,
      players,
      weekCount: weekIds.length,
    },
  });
}

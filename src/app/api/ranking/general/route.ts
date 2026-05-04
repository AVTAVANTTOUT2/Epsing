import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import type { ApiResult, RankedPlayer } from '@/types';

interface DbAgg {
  user_id: number;
  username: string;
  total_points: number;
  week_count: number;
}

interface GeneralRankingData {
  players: RankedPlayer[];
  totalWeeks: number;
}

export async function GET(): Promise<NextResponse<ApiResult<GeneralRankingData>>> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: 'Non authentifié', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const db = getDb();

  const rows = db
    .prepare(
      `SELECT ws.user_id, u.username,
              SUM(ws.points) as total_points,
              COUNT(*) as week_count
       FROM weekly_scores ws
       JOIN users u ON u.id = ws.user_id
       GROUP BY ws.user_id
       ORDER BY total_points DESC`
    )
    .all() as DbAgg[];

  const totalWeeksRow = db
    .prepare(`SELECT COUNT(*) as cnt FROM weeks WHERE status = 'tallied'`)
    .get() as { cnt: number };

  const players: RankedPlayer[] = rows.map((r, index) => ({
    userId: r.user_id,
    username: r.username,
    points: r.total_points,
    rank: index + 1,
    voteCount: r.week_count,
  }));

  return NextResponse.json({
    ok: true,
    data: {
      players,
      totalWeeks: totalWeeksRow.cnt,
    },
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { weekLabel } from '@/lib/week';
import type { ApiResult } from '@/types';

interface DbScoreRow {
  year: number;
  iso_week: number;
  points: number;
  rank: number;
  vote_count: number;
}

interface UserStats {
  userId: number;
  username: string;
  bestRank: number | null;
  avgRank: number | null;
  weekCount: number;
  history: Array<{
    year: number;
    isoWeek: number;
    label: string;
    points: number;
    rank: number;
    voteCount: number;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse<ApiResult<UserStats>>> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: 'Non authentifié', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const { userId: userIdParam } = await params;
  const userId = parseInt(userIdParam);
  if (isNaN(userId)) {
    return NextResponse.json(
      { ok: false, error: 'ID utilisateur invalide', code: 'INVALID_ID' },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') ?? 'all'; // 4w | 3m | 6m | all

  const db = getDb();

  const user = db
    .prepare('SELECT id, username FROM users WHERE id = ?')
    .get(userId) as { id: number; username: string } | undefined;

  if (!user) {
    return NextResponse.json(
      { ok: false, error: 'Utilisateur introuvable', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  let limitClause = '';
  if (period === '4w') limitClause = 'LIMIT 4';
  else if (period === '3m') limitClause = 'LIMIT 13';
  else if (period === '6m') limitClause = 'LIMIT 26';

  const rows = db
    .prepare(
      `SELECT w.year, w.iso_week, ws.points, ws.rank, ws.vote_count
       FROM weekly_scores ws
       JOIN weeks w ON w.id = ws.week_id
       WHERE ws.user_id = ? AND w.status = 'tallied'
       ORDER BY w.year DESC, w.iso_week DESC
       ${limitClause}`
    )
    .all(userId) as DbScoreRow[];

  // Reverse to chronological order for chart
  rows.reverse();

  const history = rows.map((r) => ({
    year: r.year,
    isoWeek: r.iso_week,
    label: weekLabel(r.year, r.iso_week),
    points: r.points,
    rank: r.rank,
    voteCount: r.vote_count,
  }));

  const weekCount = history.length;
  const bestRank = weekCount > 0 ? Math.min(...rows.map((r) => r.rank)) : null;
  const avgRank =
    weekCount > 0
      ? Math.round((rows.reduce((acc, r) => acc + r.rank, 0) / weekCount) * 10) / 10
      : null;

  return NextResponse.json({
    ok: true,
    data: {
      userId: user.id,
      username: user.username,
      bestRank,
      avgRank,
      weekCount,
      history,
    },
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import type { ApiResult } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResult<any>>> {
  const searchParams = request.nextUrl.searchParams;
  const p1 = parseInt(searchParams.get('p1') || '0', 10);
  const p2 = parseInt(searchParams.get('p2') || '0', 10);

  if (!p1 || !p2) {
    return NextResponse.json({ ok: false, error: 'Joueurs manquants', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const db = getDb();

  // Get users basic info
  const users = db.prepare(`
    SELECT u.id, u.username, u.elo_rating, u.bio, u.play_style, 
           COALESCE(SUM(ws.is_mvp), 0) as total_mvp
    FROM users u
    LEFT JOIN weekly_scores ws ON u.id = ws.user_id
    WHERE u.id IN (?, ?)
    GROUP BY u.id
  `).all(p1, p2) as any[];

  if (users.length !== 2) {
    return NextResponse.json({ ok: false, error: 'Joueurs introuvables', code: 'NOT_FOUND' }, { status: 404 });
  }

  const user1 = users.find(u => u.id === p1);
  const user2 = users.find(u => u.id === p2);

  // Get head to head matches
  const matches = db.prepare(`
    SELECT * FROM matches 
    WHERE (player1_id = ? AND player2_id = ?) 
       OR (player1_id = ? AND player2_id = ?)
    ORDER BY played_at DESC
  `).all(p1, p2, p2, p1) as any[];

  let wins1 = 0;
  let wins2 = 0;
  let totalPoints1 = 0;
  let totalPoints2 = 0;

  matches.forEach(m => {
    if (m.player1_id === p1) {
      if (m.score1 > m.score2) wins1++;
      else wins2++;
      totalPoints1 += m.score1;
      totalPoints2 += m.score2;
    } else {
      if (m.score2 > m.score1) wins1++;
      else wins2++;
      totalPoints1 += m.score2;
      totalPoints2 += m.score1;
    }
  });

  return NextResponse.json({
    ok: true,
    data: {
      user1,
      user2,
      headToHead: {
        totalMatches: matches.length,
        wins1,
        wins2,
        totalPoints1,
        totalPoints2,
      },
      matches
    }
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { calculateElo } from '@/lib/elo';
import type { ApiResult } from '@/types';

const matchSchema = z.object({
  opponentId: z.number().int().positive(),
  myScore: z.number().int().min(0).max(99),
  opponentScore: z.number().int().min(0).max(99),
});

export async function POST(request: NextRequest): Promise<NextResponse<ApiResult<null>>> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Non authentifié', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Corps invalide', code: 'INVALID_BODY' }, { status: 400 });
  }

  const parsed = matchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Données invalides', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const { opponentId, myScore, opponentScore } = parsed.data;

  if (opponentId === session.sub) {
    return NextResponse.json({ ok: false, error: 'Vous ne pouvez pas jouer contre vous-même', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  if (myScore === opponentScore) {
    return NextResponse.json({ ok: false, error: 'Les matchs nuls ne sont pas autorisés au ping-pong', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const db = getDb();
  
  const opponent = db.prepare('SELECT id, elo_rating FROM users WHERE id = ?').get(opponentId) as { id: number; elo_rating: number } | undefined;
  if (!opponent) {
    return NextResponse.json({ ok: false, error: 'Adversaire introuvable', code: 'NOT_FOUND' }, { status: 404 });
  }

  const me = db.prepare('SELECT elo_rating FROM users WHERE id = ?').get(session.sub) as { elo_rating: number } | undefined;
  if (!me) {
    return NextResponse.json({ ok: false, error: 'Utilisateur introuvable', code: 'NOT_FOUND' }, { status: 404 });
  }

  const transaction = db.transaction(() => {
    // Insert match
    db.prepare(`
      INSERT INTO matches (player1_id, player2_id, score1, score2, elo_change1, elo_change2)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(session.sub, opponentId, myScore, opponentScore, 0, 0);
  });

  try {
    transaction();
    return NextResponse.json({ ok: true, data: null });
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Erreur lors de la sauvegarde du match', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse<ApiResult<any[]>>> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Non authentifié', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const db = getDb();
  const matches = db.prepare(`
    SELECT 
      m.id, 
      m.score1, 
      m.score2, 
      m.elo_change1, 
      m.elo_change2, 
      m.played_at,
      u1.username as p1_username, 
      u1.id as p1_id,
      u2.username as p2_username,
      u2.id as p2_id
    FROM matches m
    JOIN users u1 ON m.player1_id = u1.id
    JOIN users u2 ON m.player2_id = u2.id
    ORDER BY m.played_at DESC
    LIMIT 50
  `).all();

  return NextResponse.json({ ok: true, data: matches });
}

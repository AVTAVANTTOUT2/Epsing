import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { validateBallot, InvalidBallotError } from '@/lib/scoring';
import type { ApiResult } from '@/types';

const schema = z.object({
  weekId: z.number().int().positive(),
  mvpUserId: z.number().int().positive().nullable().optional(),
  rankings: z.array(
    z.object({
      userId: z.number().int().positive(),
      position: z.number().int().positive(),
    })
  ).min(1),
});

interface DbWeek {
  id: number;
  status: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResult<{ voteId: number }>>> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: 'Non authentifié', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Corps de la requête invalide', code: 'INVALID_BODY' },
      { status: 400 }
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((i) => i.message).join(', ');
    return NextResponse.json(
      { ok: false, error: errors, code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  const { weekId, rankings, mvpUserId } = parsed.data;
  const db = getDb();

  const week = db
    .prepare('SELECT id, status FROM weeks WHERE id = ?')
    .get(weekId) as DbWeek | undefined;

  if (!week) {
    return NextResponse.json(
      { ok: false, error: 'Semaine introuvable', code: 'WEEK_NOT_FOUND' },
      { status: 404 }
    );
  }

  if (week.status !== 'open') {
    return NextResponse.json(
      { ok: false, error: 'Le vote est fermé pour cette semaine', code: 'VOTING_CLOSED' },
      { status: 422 }
    );
  }

  // Get active users for ballot validation
  const activeUsers = db
    .prepare('SELECT id FROM users WHERE is_active = 1')
    .all() as Array<{ id: number }>;
  const activeUserIds = activeUsers.map((u) => u.id);

  // Validate ballot
  try {
    validateBallot({ voterId: session.sub, rankings, mvpUserId }, activeUserIds);
  } catch (e) {
    if (e instanceof InvalidBallotError) {
      return NextResponse.json(
        { ok: false, error: e.message, code: 'INVALID_BALLOT' },
        { status: 422 }
      );
    }
    throw e;
  }

  // Upsert vote
  const submitVote = db.transaction(() => {
    // Delete existing vote if any
    const existingVote = db
      .prepare('SELECT id FROM votes WHERE user_id = ? AND week_id = ?')
      .get(session.sub, weekId) as { id: number } | undefined;

    if (existingVote) {
      db.prepare('DELETE FROM vote_rankings WHERE vote_id = ?').run(existingVote.id);
      db.prepare('DELETE FROM votes WHERE id = ?').run(existingVote.id);
    }

    // Insert new vote
    const voteResult = db
      .prepare('INSERT INTO votes (user_id, week_id, mvp_user_id) VALUES (?, ?, ?)')
      .run(session.sub, weekId, mvpUserId ?? null);
    const voteId = voteResult.lastInsertRowid as number;

    // Insert rankings
    const insertRanking = db.prepare(
      'INSERT INTO vote_rankings (vote_id, ranked_user_id, position) VALUES (?, ?, ?)'
    );
    for (const { userId, position } of rankings) {
      insertRanking.run(voteId, userId, position);
    }

    return voteId;
  });

  const voteId = submitVote();

  return NextResponse.json({ ok: true, data: { voteId } });
}

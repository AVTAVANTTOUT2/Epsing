import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import type { ApiResult } from '@/types';

const schema = z.object({
  bio: z.string().max(200).nullable().optional(),
  playStyle: z.string().max(50).nullable().optional(),
});

export async function PUT(request: NextRequest): Promise<NextResponse<ApiResult<null>>> {
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

  const { bio, playStyle } = parsed.data;
  const db = getDb();

  db.prepare('UPDATE users SET bio = ?, play_style = ? WHERE id = ?').run(
    bio ?? null,
    playStyle ?? null,
    session.sub
  );

  return NextResponse.json({ ok: true, data: null });
}

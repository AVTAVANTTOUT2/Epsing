import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import type { ApiResult } from '@/types';

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

interface DbUser {
  id: number;
  password_hash: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResult<null>>> {
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

  const { currentPassword, newPassword } = parsed.data;
  const db = getDb();

  const user = db
    .prepare('SELECT id, password_hash FROM users WHERE id = ?')
    .get(session.sub) as DbUser | undefined;

  if (!user) {
    return NextResponse.json(
      { ok: false, error: 'Utilisateur introuvable', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) {
    return NextResponse.json(
      { ok: false, error: 'Mot de passe actuel incorrect', code: 'INVALID_PASSWORD' },
      { status: 401 }
    );
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, user.id);

  return NextResponse.json({ ok: true, data: null });
}

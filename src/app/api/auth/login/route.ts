import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { signToken, setSessionCookie } from '@/lib/auth';
import type { ApiResult, User } from '@/types';

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const attempts = new Map<string, { count: number; resetAt: number }>();
const LIMIT = 5;
const WINDOW_MS = 5 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= LIMIT) return false;
  entry.count++;
  return true;
}

interface DbUser {
  id: number;
  username: string;
  password_hash: string;
  is_active: number;
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResult<{ user: Pick<User, 'id' | 'username'> }>>> {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { ok: false, error: 'Trop de tentatives. Réessayez dans 5 minutes.', code: 'RATE_LIMITED' },
      { status: 429 }
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
    return NextResponse.json(
      { ok: false, error: 'Identifiants manquants', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  const { username, password } = parsed.data;
  const db = getDb();

  const user = db
    .prepare('SELECT id, username, password_hash, is_active FROM users WHERE username = ? COLLATE NOCASE')
    .get(username) as DbUser | undefined;

  if (!user) {
    // Still hash to prevent timing attacks
    await bcrypt.hash('dummy-password', 12);
    return NextResponse.json(
      { ok: false, error: 'Identifiants incorrects', code: 'INVALID_CREDENTIALS' },
      { status: 401 }
    );
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return NextResponse.json(
      { ok: false, error: 'Identifiants incorrects', code: 'INVALID_CREDENTIALS' },
      { status: 401 }
    );
  }

  if (!user.is_active) {
    return NextResponse.json(
      { ok: false, error: 'Compte désactivé', code: 'ACCOUNT_DISABLED' },
      { status: 403 }
    );
  }

  const token = await signToken({ sub: user.id, username: user.username });
  await setSessionCookie(token);

  return NextResponse.json({
    ok: true,
    data: { user: { id: user.id, username: user.username } },
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { signToken, setSessionCookie, timingSafeEqual } from '@/lib/auth';
import { env } from '@/lib/env';
import type { ApiResult, User } from '@/types';

const schema = z.object({
  username: z
    .string()
    .min(3, 'Le pseudo doit contenir au moins 3 caractères')
    .max(20, 'Le pseudo ne peut pas dépasser 20 caractères')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Le pseudo ne peut contenir que des lettres, chiffres, _ et -'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(100),
  epsiCode: z.string().min(1, 'Le code EPSI est requis'),
});

// In-memory rate limiter
const attempts = new Map<string, { count: number; resetAt: number }>();
const LIMIT = 3;
const WINDOW_MS = 15 * 60 * 1000;

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

export async function POST(request: NextRequest): Promise<NextResponse<ApiResult<{ user: Pick<User, 'id' | 'username'> }>>> {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { ok: false, error: 'Trop de tentatives. Réessayez dans 15 minutes.', code: 'RATE_LIMITED' },
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
    const errors = parsed.error.issues.map((i) => i.message).join(', ');
    return NextResponse.json(
      { ok: false, error: errors, code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  const { username, password, epsiCode } = parsed.data;

  if (!timingSafeEqual(epsiCode, env.EPSI_REGISTRATION_CODE)) {
    return NextResponse.json(
      { ok: false, error: 'Code EPSI invalide', code: 'INVALID_EPSI_CODE' },
      { status: 403 }
    );
  }

  const db = getDb();
  const existing = db
    .prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE')
    .get(username);

  if (existing) {
    return NextResponse.json(
      { ok: false, error: 'Ce pseudo est déjà utilisé', code: 'USERNAME_TAKEN' },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const result = db
    .prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
    .run(username, passwordHash);

  const userId = result.lastInsertRowid as number;
  const token = await signToken({ sub: userId, username });
  await setSessionCookie(token);

  return NextResponse.json({
    ok: true,
    data: { user: { id: userId, username } },
  });
}

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import type { ApiResult, User } from '@/types';

interface DbUser {
  id: number;
  username: string;
  created_at: string;
  is_active: number;
}

export async function GET(): Promise<NextResponse<ApiResult<{ users: User[] }>>> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: 'Non authentifié', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const db = getDb();
  const rows = db
    .prepare('SELECT id, username, created_at, is_active FROM users WHERE is_active = 1 ORDER BY username ASC')
    .all() as DbUser[];

  const users: User[] = rows.map((r) => ({
    id: r.id,
    username: r.username,
    createdAt: r.created_at,
    isActive: Boolean(r.is_active),
  }));

  return NextResponse.json({ ok: true, data: { users } });
}

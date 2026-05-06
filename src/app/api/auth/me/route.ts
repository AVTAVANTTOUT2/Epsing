import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import type { ApiResult, User } from '@/types';

interface DbUser {
  id: number;
  username: string;
  created_at: string;
  is_active: number;
  bio: string | null;
  play_style: string | null;
  elo_rating: number;
}

export async function GET(): Promise<NextResponse<ApiResult<{ user: User }>>> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: 'Non authentifié', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const db = getDb();
  const user = db
    .prepare('SELECT id, username, created_at, is_active, bio, play_style, elo_rating FROM users WHERE id = ?')
    .get(session.sub) as DbUser | undefined;

  if (!user) {
    return NextResponse.json(
      { ok: false, error: 'Utilisateur introuvable', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.created_at,
        isActive: Boolean(user.is_active),
        bio: user.bio,
        playStyle: user.play_style,
        eloRating: user.elo_rating,
      },
    },
  });
}

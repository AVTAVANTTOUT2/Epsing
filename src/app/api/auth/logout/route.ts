import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';
import type { ApiResult } from '@/types';

export async function POST(): Promise<NextResponse<ApiResult<null>>> {
  await clearSessionCookie();
  return NextResponse.json({ ok: true, data: null });
}

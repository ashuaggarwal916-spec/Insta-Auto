import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';

async function getUserId(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get('authorization');
  if (!auth) return null;
  try {
    const decoded = verifyToken(auth.replace('Bearer ', ''));
    return decoded?.userId || null;
  } catch { return null; }
}

export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, include: { _count: { select: { videos: true, clips: true } } } });
    return NextResponse.json(users);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

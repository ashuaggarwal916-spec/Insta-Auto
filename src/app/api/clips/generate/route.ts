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

export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { videoId, trimStart, trimEnd, clipCount } = await request.json();
    if (!videoId) return NextResponse.json({ error: 'videoId required' }, { status: 400 });
    
    const video = await prisma.video.findFirst({ where: { id: videoId, userId } });
    if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    
    await prisma.video.update({ where: { id: videoId }, data: { status: 'PROCESSING' } });
    return NextResponse.json({ message: 'Clip generation started' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

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
    const { videoId, instagramConnectionId, totalClips, intervalMinutes, metadata } = await request.json();
    if (!videoId || !instagramConnectionId) return NextResponse.json({ error: 'videoId and instagramConnectionId required' }, { status: 400 });
    
    const metaStr = metadata ? JSON.stringify(metadata) : null;
    const batch = await prisma.uploadBatch.create({ 
      data: { userId, videoId, instagramConnectionId, totalClips: Math.min(totalClips || 15, 20), intervalMinutes: intervalMinutes || 60, status: 'QUEUED', metadata: metaStr } 
    });
    return NextResponse.json(batch);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const batches = await prisma.uploadBatch.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, include: { uploadSchedules: true } });
    return NextResponse.json(batches);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

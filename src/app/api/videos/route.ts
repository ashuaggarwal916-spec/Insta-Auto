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
    const { youtubeUrl, title, description } = await request.json();
    if (!youtubeUrl || !title) return NextResponse.json({ error: 'youtubeUrl and title required' }, { status: 400 });
    
    const video = await prisma.video.create({ data: { userId, youtubeUrl, title, description, status: 'QUEUED' } });
    return NextResponse.json(video);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const videos = await prisma.video.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, include: { clips: true } });
    return NextResponse.json(videos);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

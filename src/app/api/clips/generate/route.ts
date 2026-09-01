import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function getUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  return payload?.userId || null;
}

export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { videoId, trimStart = 0, trimEnd = 0, clipCount = 5 } = await request.json();
  if (!videoId) return NextResponse.json({ error: 'videoId required' }, { status: 400 });

  const video = await prisma.video.findFirst({ where: { id: videoId, userId } });
  if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });

  // Create clips in database
  const clips = [];
  for (let i = 0; i < clipCount; i++) {
    const clip = await prisma.clip.create({
      data: {
        videoId,
        userId,
        title: `${video.title} - Clip ${i + 1}`,
        status: 'pending',
        startTime: trimStart,
        endTime: trimEnd || video.duration || 60,
      },
    });
    clips.push(clip);
  }

  // In production, this would trigger a background job with yt-dlp + FFmpeg
  // For now, we mark them as processing
  await prisma.video.update({
    where: { id: videoId },
    data: { status: 'processing' },
  });

  return NextResponse.json({ message: 'Clip generation started', clips });
}

export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clips = await prisma.clip.findMany({
    where: { userId },
    include: { video: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(clips);
}

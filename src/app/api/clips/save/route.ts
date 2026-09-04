import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/clips/save - Save a clip (called by worker)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.WORKER_SECRET || 'worker-secret'}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { videoId, title, filePath, duration, startTime, endTime, hashtags, keywords, titles } = await request.json();
    if (!videoId) return NextResponse.json({ error: 'videoId required' }, { status: 400 });

    // Find the video to get userId
    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });

    await prisma.clip.create({
      data: {
        videoId,
        userId: video.userId,
        title,
        filePath,
        duration,
        startTime,
        endTime,
        status: 'ready',
        hashtags,
        keywords,
        titles,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

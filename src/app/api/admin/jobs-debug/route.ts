import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/jobs-debug - Check job states (temporary debug)
export async function GET(request: NextRequest) {
  try {
    const pending = await prisma.job.count({ where: { status: 'pending' } });
    const processing = await prisma.job.count({ where: { status: 'processing' } });
    const completed = await prisma.job.count({ where: { status: 'completed' } });
    const failed = await prisma.job.count({ where: { status: 'failed' } });
    
    const recentJobs = await prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, type: true, status: true, error: true, progress: true, data: true, createdAt: true },
    });

    const recentVideos = await prisma.video.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, status: true, duration: true, youtubeUrl: true },
    });

    // Find queued videos without jobs
    const queuedVideos = await prisma.video.findMany({
      where: { status: 'queued' },
      select: { id: true, title: true, youtubeUrl: true },
    });

    return NextResponse.json({
      counts: { pending, processing, completed, failed },
      recentJobs,
      recentVideos,
      queuedVideosWithoutJobs: queuedVideos,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

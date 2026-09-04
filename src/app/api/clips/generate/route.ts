import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';

// GET /api/clips/generate - List user's clips
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const clips = await prisma.clip.findMany({
      where: { userId },
      include: { video: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(clips);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/clips/generate - Create a job for video clipping
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { videoId, clipCount = 5, clipDuration = 60 } = await request.json();
  if (!videoId) return NextResponse.json({ error: 'videoId required' }, { status: 400 });

  const video = await prisma.video.findFirst({ where: { id: videoId, userId } });
  if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });

  // Create a job for the worker
  const job = await prisma.job.create({
    data: {
      userId,
      type: 'download_and_clip',
      data: JSON.stringify({ videoId, youtubeUrl: video.youtubeUrl, title: video.title, clipCount, clipDuration }),
      status: 'pending',
    },
  });

  // Update video status
  await prisma.video.update({
    where: { id: videoId },
    data: { status: 'queued' },
  });

  return NextResponse.json({
    message: 'Clip generation queued',
    jobId: job.id,
    status: 'queued'
  });
}

// POST /api/clips/generate/all - Create jobs for all queued videos without jobs
export async function PUT(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Find videos that are queued but don't have jobs
    const videos = await prisma.video.findMany({
      where: { userId, status: 'queued' },
    });

    const jobs = [];
    for (const video of videos) {
      // Check if there's already a pending job for this video
      const existing = await prisma.job.findFirst({
        where: {
          type: 'download_and_clip',
          status: { in: ['pending', 'processing'] },
          data: { contains: video.id },
        },
      });

      if (!existing) {
        const job = await prisma.job.create({
          data: {
            userId,
            type: 'download_and_clip',
            data: JSON.stringify({ videoId: video.id, youtubeUrl: video.youtubeUrl, title: video.title, clipCount: 5, clipDuration: 60 }),
            status: 'pending',
          },
        });
        jobs.push(job.id);
      }
    }

    return NextResponse.json({ message: `Created ${jobs.length} jobs`, jobIds: jobs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function getUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  return payload?.userId || null;
}

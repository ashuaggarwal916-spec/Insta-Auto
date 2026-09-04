import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';

async function getUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  return payload?.userId || null;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// POST /api/publish - Create publish job
export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { clipIds, minWait = 20, maxWait = 30, mode = 'batch' } = await req.json();
  if (!clipIds?.length) {
    return NextResponse.json({ error: 'clipIds required' }, { status: 400 });
  }

  // Verify clips belong to user
  const clips = await prisma.clip.findMany({
    where: { id: { in: clipIds }, userId, status: 'ready' },
  });

  if (!clips.length) {
    return NextResponse.json({ error: 'No ready clips found' }, { status: 400 });
  }

  // Shuffle clips
  const shuffled = shuffle(clips);
  const shuffledIds = shuffled.map(c => c.id);

  // Create batch record
  const batch = await prisma.batch.create({
    data: {
      userId,
      name: `Publish ${mode} - ${new Date().toISOString().slice(0, 19)}`,
      status: 'running',
      items: {
        create: shuffledIds.map((clipId, idx) => ({
          videoId: shuffled[idx].videoId,
          clipId,
          order: idx,
          status: 'pending',
        })),
      },
    },
  });

  // Create publish job
  const job = await prisma.job.create({
    data: {
      userId,
      type: 'publish',
      data: JSON.stringify({ clipIds: shuffledIds, minWait, maxWait, batchId: batch.id }),
      status: 'pending',
    },
  });

  return NextResponse.json({
    batch,
    jobId: job.id,
    totalClips: shuffledIds.length,
    estimatedTime: `${shuffledIds.length * minWait}-${shuffledIds.length * maxWait} seconds`,
    mode,
  });
}

// GET /api/publish - Get publishing status
export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const batches = await prisma.batch.findMany({
    where: { userId, status: 'running' },
    include: {
      items: {
        include: { clip: true },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  return NextResponse.json(batches);
}

// PATCH /api/publish - Pause/resume/stop publishing
export async function PATCH(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { batchId, action } = await req.json();
  if (!batchId || !action) {
    return NextResponse.json({ error: 'batchId and action required' }, { status: 400 });
  }

  const batch = await prisma.batch.findFirst({
    where: { id: batchId, userId },
  });

  if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

  const statusMap: Record<string, string> = {
    pause: 'paused',
    resume: 'running',
    stop: 'stopped',
  };

  await prisma.batch.update({
    where: { id: batchId },
    data: { status: statusMap[action] || batch.status },
  });

  return NextResponse.json({ success: true });
}

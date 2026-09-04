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

// POST /api/batches - Create a batch of clips for publishing
export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, clipIds, intervalSeconds = 30 } = await req.json();
  if (!clipIds?.length) {
    return NextResponse.json({ error: 'name and clipIds required' }, { status: 400 });
  }

  // Get clips to fetch videoId
  const clips = await prisma.clip.findMany({
    where: { id: { in: clipIds }, userId },
    select: { id: true, videoId: true },
  });

  const batch = await prisma.batch.create({
    data: {
      userId,
      name,
      status: 'pending',
      items: {
        create: clipIds.map((clipId: string, idx: number) => {
          const clip = clips.find(c => c.id === clipId);
          return {
            videoId: clip?.videoId || '',
            clipId,
            order: idx,
            status: 'pending',
          };
        }),
      },
    },
  });

  return NextResponse.json({ batch });
}

// GET /api/batches - List user's batches
export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const batches = await prisma.batch.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          video: true,
        },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(batches);
}

// PATCH /api/batches - Start, pause, or stop a batch
export async function PATCH(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { batchId, action } = await req.json();
  if (!batchId || !action) {
    return NextResponse.json({ error: 'batchId and action required' }, { status: 400 });
  }

  const batch = await prisma.batch.findFirst({
    where: { id: batchId, userId },
    include: { items: { include: { video: true } } },
  });

  if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

  if (action === 'start') {
    await prisma.batch.update({
      where: { id: batchId },
      data: { status: 'running' },
    });
  } else if (action === 'pause') {
    await prisma.batch.update({
      where: { id: batchId },
      data: { status: 'paused' },
    });
  } else if (action === 'stop') {
    await prisma.batch.update({
      where: { id: batchId },
      data: { status: 'stopped' },
    });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/batches - Delete a batch
export async function DELETE(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { batchId } = await req.json();
  if (!batchId) return NextResponse.json({ error: 'batchId required' }, { status: 400 });

  await prisma.batchItem.deleteMany({
    where: { batch: { id: batchId, userId } },
  });
  await prisma.batch.deleteMany({
    where: { id: batchId, userId },
  });

  return NextResponse.json({ success: true });
}

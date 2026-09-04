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

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// POST /api/schedules - Create a schedule
export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, clipIds, intervalSeconds = 30, scheduledAt, videoCount, excludePrevious } = await req.json();
  if (!name || !clipIds?.length || !scheduledAt) {
    return NextResponse.json({ error: 'name, clipIds, and scheduledAt required' }, { status: 400 });
  }

  // If excludePrevious is true, filter out clips that have been published before
  let finalClipIds = clipIds;
  if (excludePrevious) {
    const publishedClips = await prisma.clip.findMany({
      where: { id: { in: clipIds }, instagramStatus: 'published' },
      select: { id: true },
    });
    const publishedIds = new Set(publishedClips.map(c => c.id));
    finalClipIds = clipIds.filter((id: string) => !publishedIds.has(id));
  }

  // If videoCount is specified, limit the number of clips
  if (videoCount && videoCount < finalClipIds.length) {
    finalClipIds = shuffle(finalClipIds).slice(0, videoCount);
  }

  const schedule = await prisma.schedule.create({
    data: {
      userId,
      name,
      clipIds: finalClipIds,
      intervalSeconds,
      scheduledAt: new Date(scheduledAt),
      status: 'pending',
    },
  });

  return NextResponse.json({ schedule });
}

// GET /api/schedules - List user's schedules
export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const schedules = await prisma.schedule.findMany({
    where: { userId },
    orderBy: { scheduledAt: 'desc' },
  });

  return NextResponse.json(schedules);
}

// PATCH /api/schedules - Cancel a schedule
export async function PATCH(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { scheduleId, action } = await req.json();
  if (!scheduleId) return NextResponse.json({ error: 'scheduleId required' }, { status: 400 });

  if (action === 'cancel') {
    await prisma.schedule.update({
      where: { id: scheduleId },
      data: { status: 'cancelled' },
    });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/schedules - Delete a schedule
export async function DELETE(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { scheduleId } = await req.json();
  if (!scheduleId) return NextResponse.json({ error: 'scheduleId required' }, { status: 400 });

  await prisma.schedule.deleteMany({
    where: { id: scheduleId, userId },
  });

  return NextResponse.json({ success: true });
}

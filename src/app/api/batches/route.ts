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

export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, videoIds, scheduledAt } = await request.json();
  if (!name || !videoIds?.length) {
    return NextResponse.json({ error: 'name and videoIds required' }, { status: 400 });
  }

  const batch = await prisma.batch.create({
    data: {
      userId,
      name,
      status: 'pending',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      items: {
        create: videoIds.map((videoId: string, index: number) => ({
          videoId,
          order: index,
          status: 'pending',
        })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json(batch);
}

export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const batches = await prisma.batch.findMany({
    where: { userId },
    include: { items: { include: { video: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(batches);
}

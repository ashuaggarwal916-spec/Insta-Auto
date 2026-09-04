import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/clips/publish - Mark clip as published (called by worker)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.WORKER_SECRET || 'worker-secret'}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clipId } = await request.json();
    if (!clipId) return NextResponse.json({ error: 'clipId required' }, { status: 400 });

    await prisma.clip.update({
      where: { id: clipId },
      data: { instagramStatus: 'published', publishedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

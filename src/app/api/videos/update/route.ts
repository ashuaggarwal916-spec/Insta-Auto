import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/videos/update - Update video status (called by worker)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.WORKER_SECRET || 'worker-secret'}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { videoId, status, duration, filePath } = await request.json();
    if (!videoId) return NextResponse.json({ error: 'videoId required' }, { status: 400 });

    await prisma.video.update({
      where: { id: videoId },
      data: { status, duration, filePath },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

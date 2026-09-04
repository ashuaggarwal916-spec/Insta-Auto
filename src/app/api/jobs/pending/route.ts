import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/jobs/pending - Get the oldest pending job
export async function GET(request: NextRequest) {
  try {
    // Minimal auth check - the worker doesn't have user context
    // This is a server-to-server endpoint
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.WORKER_SECRET || 'worker-secret'}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const job = await prisma.job.findFirst({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
    });

    if (!job) {
      return NextResponse.json({ job: null });
    }

    return NextResponse.json({ job });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

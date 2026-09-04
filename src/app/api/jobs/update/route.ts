import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/jobs/update - Update job status (called by worker)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.WORKER_SECRET || 'worker-secret'}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId, status, progress, result, error } = await request.json();
    if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 });

    await prisma.job.update({
      where: { id: jobId },
      data: { status, progress, result, error },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

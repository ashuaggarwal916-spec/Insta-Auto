import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/admin/jobs-reset - Reset failed jobs to pending (temporary)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.WORKER_SECRET || 'worker-secret'}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all failed jobs and check their data
    const failedJobs = await prisma.job.findMany({
      where: { status: 'failed' },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const results = [];
    for (const job of failedJobs) {
      let data;
      try {
        data = typeof job.data === 'string' ? JSON.parse(job.data) : job.data;
      } catch {
        data = { parseError: true };
      }

      results.push({
        id: job.id,
        type: job.type,
        error: job.error?.slice(0, 60),
        hasVideoId: !!data?.videoId,
        hasYoutubeUrl: !!data?.youtubeUrl,
        dataKeys: Object.keys(data || {}),
      });
    }

    return NextResponse.json({ count: failedJobs.length, jobs: results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/jobs-reset - Actually reset failed jobs
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.WORKER_SECRET || 'worker-secret'}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await prisma.job.updateMany({
      where: { status: 'failed' },
      data: { status: 'pending', progress: 0, error: null },
    });

    return NextResponse.json({ reset: result.count });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

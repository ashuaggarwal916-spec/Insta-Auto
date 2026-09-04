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

// POST /api/videos - Create video with metadata
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { youtubeUrl, title, description, titles, hashtags, keywords } = await request.json();
    if (!youtubeUrl || !title) {
      return NextResponse.json({ error: 'youtubeUrl and title required' }, { status: 400 });
    }
    
    const video = await prisma.video.create({ 
      data: { 
        userId, 
        youtubeUrl, 
        title, 
        description,
        titles: titles || [],
        hashtags: hashtags || [],
        keywords: keywords || [],
        status: 'QUEUED' 
      } 
    });
    return NextResponse.json(video);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET /api/videos - List user's videos
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const videos = await prisma.video.findMany({ 
      where: { userId }, 
      orderBy: { createdAt: 'desc' }, 
      include: { clips: true } 
    });
    return NextResponse.json(videos);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

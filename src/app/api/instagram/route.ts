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

// Initiate Instagram OAuth
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const appId = process.env.INSTAGRAM_APP_ID;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
  
  if (!appId || !redirectUri) {
    return NextResponse.json({ error: 'Instagram not configured' }, { status: 500 });
  }

  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=instagram_basic,instagram_content_publish,instagram_manage_insights&response_type=code`;

  return NextResponse.json({ authUrl });
}

// Handle Instagram OAuth callback
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { code } = await request.json();
  if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 });

  const appId = process.env.INSTAGRAM_APP_ID;
  const appSecret = process.env.INSTAGRAM_APP_SECRET;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

  try {
    // Exchange code for access token
    const tokenRes = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}&redirect_uri=${encodeURIComponent(redirectUri!)}`);
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      return NextResponse.json({ error: tokenData.error.message }, { status: 400 });
    }

    // Get Instagram user info
    const userRes = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,username&access_token=${tokenData.access_token}`);
    const userData = await userRes.json();

    // Save connection - find existing or create new
    const existing = await prisma.instagramConnection.findFirst({ where: { userId } });
    if (existing) {
      await prisma.instagramConnection.update({
        where: { id: existing.id },
        data: {
          accessToken: tokenData.access_token,
          tokenType: tokenData.token_type,
          expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
          instagramUserId: userData.id,
          username: userData.username,
        },
      });
    } else {
      await prisma.instagramConnection.create({
        data: {
          userId,
          accessToken: tokenData.access_token,
          tokenType: tokenData.token_type,
          expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
          instagramUserId: userData.id,
          username: userData.username,
        },
      });
    }

    return NextResponse.json({ success: true, username: userData.username });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Get Instagram connection status
export async function PUT(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const connection = await prisma.instagramConnection.findFirst({
    where: { userId },
  });

  return NextResponse.json({
    connected: !!connection,
    username: connection?.username,
    expiresAt: connection?.expiresAt,
  });
}

// Disconnect Instagram
export async function DELETE(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.instagramConnection.deleteMany({
    where: { userId },
  });

  return NextResponse.json({ success: true });
}

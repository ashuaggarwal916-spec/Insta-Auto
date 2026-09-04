import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';

async function getUserId(req: NextRequest): Promise<string | null> {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    return payload?.userId || null;
  } catch {
    return null;
  }
}

function generateState(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function buildOAuthUrl(appId: string, redirectUri: string, state: string): string {
  const scopes = [
    'instagram_business_basic',
    'instagram_business_manage_messages',
    'instagram_business_manage_comments',
    'instagram_business_content_publish',
    'instagram_business_manage_insights',
  ].join(',');

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
    state: state,
    force_authentication: '1',
  });

  return `https://api.instagram.com/oauth/authorize?${params.toString()}`;
}

// GET /api/instagram - Get OAuth URL (requires auth)
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const appId = process.env.INSTAGRAM_APP_ID;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
    
    if (!appId || !redirectUri) {
      return NextResponse.json({ error: 'Instagram not configured' }, { status: 500 });
    }

    const state = generateState();
    const authUrl = buildOAuthUrl(appId, redirectUri, state);
    return NextResponse.json({ authUrl, state });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to generate OAuth URL' }, { status: 500 });
  }
}

// POST /api/instagram - Handle OAuth callback (requires auth)
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

    const { code, state } = body;
    if (!code) return NextResponse.json({ error: 'Authorization code required' }, { status: 400 });

    const appId = process.env.INSTAGRAM_APP_ID;
    const appSecret = process.env.INSTAGRAM_APP_SECRET;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

    if (!appId || !appSecret || !redirectUri) {
      return NextResponse.json({ error: 'Instagram configuration incomplete' }, { status: 500 });
    }

    // Step 1: Exchange code for short-lived token
    const formData = new URLSearchParams();
    formData.append('client_id', appId);
    formData.append('client_secret', appSecret);
    formData.append('code', code);
    formData.append('grant_type', 'authorization_code');
    formData.append('redirect_uri', redirectUri);

    const tokenRes = await fetch('https://api.instagram.com/oauth_access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    const tokenData: any = await tokenRes.json().catch(() => null);
    
    if (!tokenData || tokenData.error) {
      return NextResponse.json({ 
        error: tokenData?.error?.message || 'Token exchange failed',
        code: 'TOKEN_EXCHANGE_FAILED'
      }, { status: 400 });
    }

    const shortLivedToken = tokenData.access_token;
    const instagramUserId = tokenData.user_id;

    if (!shortLivedToken) {
      return NextResponse.json({ error: 'No access token received from Instagram' }, { status: 400 });
    }

    // Step 2: Exchange for long-lived token
    let accessToken = shortLivedToken;
    let expiresAt: Date | null = null;
    
    try {
      const longLivedRes = await fetch(`https://graph.instagram.com/access_token?` + new URLSearchParams({
        grant_type: 'ig_exchange_token',
        client_secret: appSecret,
        access_token: shortLivedToken,
      }));

      const longLivedData: any = await longLivedRes.json().catch(() => null);
      
      if (longLivedData && longLivedData.access_token) {
        accessToken = longLivedData.access_token;
        const expiresIn = longLivedData.expires_in;
        if (expiresIn) {
          expiresAt = new Date(Date.now() + expiresIn * 1000);
        }
      }
    } catch {
      // Use short-lived token if long-lived exchange fails
    }

    // Step 3: Get user info
    let username: string | null = null;
    try {
      const userRes = await fetch(`https://graph.instagram.com/${instagramUserId}?fields=id,username&access_token=${accessToken}`);
      const userData: any = await userRes.json().catch(() => null);
      if (userData) {
        username = userData.username || null;
      }
    } catch {
      // Continue without username
    }

    // Step 4: Save connection (multi-user: each user has their own connection)
    const existing = await prisma.instagramConnection.findFirst({ where: { userId } }).catch(() => null);
    
    const connectionData = {
      accessToken: accessToken,
      tokenType: 'bearer',
      expiresAt: expiresAt,
      instagramUserId: instagramUserId,
      username: username || undefined,
      facebookPageId: null,
      pageAccessToken: null,
    };

    if (existing) {
      await prisma.instagramConnection.update({
        where: { id: existing.id },
        data: connectionData,
      }).catch(() => null);
    } else {
      await prisma.instagramConnection.create({
        data: {
          userId,
          ...connectionData,
        },
      }).catch(() => null);
    }

    return NextResponse.json({ 
      success: true, 
      username: username,
      instagramUserId: instagramUserId,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to process Instagram connection' }, { status: 500 });
  }
}

// PUT /api/instagram - Get connection status (requires auth)
export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const connection = await prisma.instagramConnection.findFirst({
      where: { userId },
    }).catch(() => null);

    return NextResponse.json({
      connected: !!connection,
      username: connection?.username,
      expiresAt: connection?.expiresAt,
      instagramUserId: connection?.instagramUserId,
    });
  } catch {
    return NextResponse.json({ connected: false });
  }
}

// DELETE /api/instagram - Disconnect Instagram (requires auth)
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await prisma.instagramConnection.deleteMany({
      where: { userId },
    }).catch(() => null);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}

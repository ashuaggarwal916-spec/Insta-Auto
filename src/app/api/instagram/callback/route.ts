import { NextRequest, NextResponse } from 'next/server';

// GET /api/instagram/callback - OAuth callback from Instagram
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    // If user denied access or Instagram returned an error
    if (error) {
      const errorMsg = errorDescription || error;
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(errorMsg)}&instagram=denied`, request.url)
      );
    }

    // If no code, something went wrong
    if (!code) {
      return NextResponse.redirect(
        new URL('/?error=missing_code&instagram=failed', request.url)
      );
    }

    // Redirect to frontend with code and state for processing
    return NextResponse.redirect(
      new URL(`/?instagram_code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || '')}`, request.url)
    );
  } catch (err: any) {
    // Never return HTML - always redirect
    return NextResponse.redirect(
      new URL('/?error=callback_error&instagram=failed', request.url)
    );
  }
}

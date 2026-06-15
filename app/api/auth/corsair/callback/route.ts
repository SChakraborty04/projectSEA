import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { processOAuthCallback } from 'corsair/oauth';
import { corsair } from '@/lib/corsair';

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
        const returnTo = request.cookies.get('returnTo')?.value || '/dashboard';
        const response = NextResponse.redirect(`${origin}${returnTo}?error=missing_params`);
        response.cookies.delete('oauth_state');
        response.cookies.delete('returnTo');
        return response;
    }

    const storedState = request.cookies.get('oauth_state')?.value;
    const returnTo = request.cookies.get('returnTo')?.value || '/dashboard';

    if (!storedState || storedState !== state) {
        const response = NextResponse.redirect(`${origin}${returnTo}?error=invalid_state`);
        response.cookies.delete('oauth_state');
        response.cookies.delete('returnTo');
        return response;
    }

    // APP_URL is the single source of truth (set in .env).
    // Fallback chain: APP_URL → BETTER_AUTH_URL → localhost
    const baseUrl = (
        process.env.APP_URL ??
        process.env.BETTER_AUTH_URL ??
        'http://localhost:3000'
    ).replace(/\/$/, '');
    const redirectUri = `${baseUrl}/api/auth/corsair/callback`;

    try {
        const result = await processOAuthCallback(corsair, { code, state, redirectUri });
        // Redirect back to returnTo page with success, passing tenantId for webhook registration
        const response = NextResponse.redirect(
            `${baseUrl}${returnTo}?connected=true&tenantId=${encodeURIComponent(result.tenantId)}`
        );
        response.cookies.delete('oauth_state');
        response.cookies.delete('returnTo');
        return response;
    } catch (err) {
        console.error('[corsair oauth callback error]', err);
        const response = NextResponse.redirect(`${baseUrl}${returnTo}?error=oauth_failed`);
        response.cookies.delete('oauth_state');
        response.cookies.delete('returnTo');
        return response;
    }
}


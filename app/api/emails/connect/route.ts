import { NextResponse } from 'next/server';
import { generateOAuthUrl } from 'corsair/oauth';
import { corsair } from '@/lib/corsair';
import { getSession } from '@/lib/session';

export async function GET() {
    const session = await getSession();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.user.id;

    // APP_URL is the single source of truth (set in .env).
    // Fallback chain: APP_URL → BETTER_AUTH_URL → localhost
    const baseUrl = (
        process.env.APP_URL ??
        process.env.BETTER_AUTH_URL ??
        'http://localhost:3000'
    ).replace(/\/$/, '');
    const redirectUri = `${baseUrl}/api/auth/corsair/callback`;

    // Ensure the tenant exists in Corsair
    try {
        await corsair.manage.tenants.get(tenantId);
    } catch {
        // Tenant doesn't exist yet — create it
        await corsair.manage.tenants.create({ id: tenantId });
    }

    const { url, state } = await generateOAuthUrl(corsair, 'gmail', {
        tenantId,
        redirectUri,
    });

    const parsedUrl = new URL(url);

    // Override broad gmail scopes with Google-approved narrower scopes
    const scopes = parsedUrl.searchParams.get('scope')?.split(' ') || [];
    const filteredScopes = scopes.filter(
        s => s !== 'https://www.googleapis.com/auth/gmail.modify' &&
             s !== 'https://www.googleapis.com/auth/gmail.labels' &&
             s !== 'https://www.googleapis.com/auth/gmail.compose'
    );
    if (!filteredScopes.includes('https://www.googleapis.com/auth/gmail.readonly')) {
        filteredScopes.push('https://www.googleapis.com/auth/gmail.readonly');
    }
    if (!filteredScopes.includes('https://www.googleapis.com/auth/gmail.send')) {
        filteredScopes.push('https://www.googleapis.com/auth/gmail.send');
    }
    parsedUrl.searchParams.set('scope', filteredScopes.join(' '));

    if (!parsedUrl.searchParams.has('prompt')) {
        parsedUrl.searchParams.set('prompt', 'consent');
    }
    if (!parsedUrl.searchParams.has('access_type')) {
        parsedUrl.searchParams.set('access_type', 'offline');
    }

    const response = NextResponse.json({ url: parsedUrl.toString() });
    response.cookies.set('oauth_state', state, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 10, // 10 minutes
    });
    response.cookies.set('returnTo', '/dashboard/email', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 10, // 10 minutes
    });

    return response;
}

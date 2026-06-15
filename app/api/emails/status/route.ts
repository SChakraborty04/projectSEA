import { NextResponse } from 'next/server';
import { corsair } from '@/lib/corsair';
import { getSession } from '@/lib/session';

export async function GET() {
    const session = await getSession();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.user.id;

    try {
        const status = await corsair.manage.connectionStatus.get({ tenantId });
        if (status['gmail'] !== 'connected') {
            return NextResponse.json({ connected: false, status: 'not_connected' });
        }

        // Verify the token by doing a lightweight fetch
        try {
            await corsair.withTenant(tenantId).gmail.api.labels.list({ userId: 'me' });
            return NextResponse.json({ connected: true, status: 'connected' });
        } catch (err: any) {
            // If the token is expired/invalid, Google returns 401
            if (err?.status === 401 || err?.body?.error?.code === 401) {
                return NextResponse.json({ connected: false, status: 'auth_expired' });
            }
            // Some other error, assume still connected or throw
            return NextResponse.json({ connected: true, status: 'connected' });
        }
    } catch {
        return NextResponse.json({ connected: false, status: 'not_connected' });
    }
}

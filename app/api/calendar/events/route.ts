import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/session';
import { pool } from '@/db/index';

type RawEvent = {
    id: string;
    summary?: string;
    description?: string;
    start?: { dateTime?: string; date?: string };
    end?: { dateTime?: string; date?: string };
};

function normaliseEvent(m: RawEvent) {
    const time = m.start?.dateTime
        ? new Date(m.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'All Day';
    
    const datetime = m.start?.dateTime || m.start?.date || '';
    let day = null;
    if (datetime) {
        day = new Date(datetime);
        day.setHours(0, 0, 0, 0); // Normalize to start of day
    }

    return {
        id: m.id || Math.random().toString(),
        name: m.summary || 'Untitled Event',
        time,
        datetime,
        day,
    };
}

async function fetchFromDb(tenantId: string) {
    const res = await pool.query(
        `SELECT e.data 
         FROM corsair_entities e
         JOIN corsair_accounts a ON e.account_id = a.id
         WHERE e.entity_type = 'events' AND a.tenant_id = $1 
         ORDER BY e.created_at DESC 
         LIMIT 100`,
        [tenantId]
    );

    const events = res.rows
        .map((row: any) => row.data as RawEvent)
        .filter(Boolean)
        .map(normaliseEvent)
        .filter((e: any) => e.day !== null);

    // Group by day for the calendar
    const grouped = events.reduce((acc: Record<string, any>, event: any) => {
        const dateKey = event.day!.toISOString();
        if (!acc[dateKey]) {
            acc[dateKey] = { day: event.day, events: [] };
        }
        acc[dateKey].events.push(event);
        return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped);
}

export async function GET(request: NextRequest) {
    const session = await getSession();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.user.id;

    try {
        const data = await fetchFromDb(tenantId);
        return NextResponse.json({ data });
    } catch (err) {
        console.error('[calendar/events error]', err);
        return NextResponse.json({ data: [], error: String(err) }, { status: 500 });
    }
}

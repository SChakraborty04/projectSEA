import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/session';
import { pool } from '@/db/index';
import { corsair } from '@/lib/corsair';

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

    const rawSummary = m.summary || 'Untitled Event';
    const isCompleted = rawSummary.startsWith('[COMPLETED] ');
    const displayName = isCompleted ? rawSummary.replace('[COMPLETED] ', '') : rawSummary;

    return {
        id: m.id || Math.random().toString(),
        name: displayName,
        time,
        datetime,
        day,
        completed: isCompleted,
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

export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.user.id;

    try {
        const body = await request.json();
        const { summary, description, startDateTime, endDateTime } = body;

        if (!summary || !startDateTime || !endDateTime) {
            return NextResponse.json({ error: 'Missing summary, startDateTime, or endDateTime' }, { status: 400 });
        }

        const client = corsair.withTenant(tenantId);
        const res = await client.googlecalendar.api.events.create({
            calendarId: 'primary',
            event: {
                summary,
                description,
                start: {
                    dateTime: startDateTime,
                },
                end: {
                    dateTime: endDateTime,
                }
            }
        });

        return NextResponse.json({ success: true, event: res });
    } catch (err: any) {
        console.error('[calendar/events create error]', err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    const session = await getSession();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.user.id;

    try {
        const body = await request.json();
        const { eventId, completed } = body;

        if (!eventId) {
            return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });
        }

        const client = corsair.withTenant(tenantId);
        
        // 1. Fetch current event details
        const event = await client.googlecalendar.api.events.get({
            calendarId: 'primary',
            id: eventId
        });

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // 2. Adjust summary based on completion status
        const currentSummary = event.summary || 'Untitled Event';
        let newSummary = currentSummary;

        if (completed) {
            if (!currentSummary.startsWith('[COMPLETED] ')) {
                newSummary = `[COMPLETED] ${currentSummary}`;
            }
        } else {
            if (currentSummary.startsWith('[COMPLETED] ')) {
                newSummary = currentSummary.replace('[COMPLETED] ', '');
            }
        }

        // 3. Update the event on Google Calendar
        const updatedEvent = await client.googlecalendar.api.events.update({
            calendarId: 'primary',
            id: eventId,
            event: {
                summary: newSummary,
                start: event.start,
                end: event.end,
                description: event.description,
                location: event.location,
            }
        });

        // 4. Update the local postgres database cache (data JSONB property)
        await pool.query(
            `UPDATE corsair_entities e
             SET data = data || $1::jsonb, updated_at = NOW()
             FROM corsair_accounts a
             WHERE e.account_id = a.id 
               AND e.entity_type = 'events' 
               AND e.entity_id = $2 
               AND a.tenant_id = $3`,
            [JSON.stringify({ summary: newSummary }), eventId, tenantId]
        );

        return NextResponse.json({ success: true, event: updatedEvent });
    } catch (err: any) {
        console.error('[calendar/events update error]', err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

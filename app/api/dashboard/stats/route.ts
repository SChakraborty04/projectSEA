import { getSession } from '@/lib/session';
import { pool } from '@/db/index';

export async function GET(req: Request) {
    try {
        const session = await getSession();
        const tenantId = session?.user?.id;
        if (!tenantId) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        // 1. Total emails count
        const emailsCountRes = await pool.query(
            `SELECT COUNT(*) as count FROM corsair_entities e
             JOIN corsair_accounts a ON e.account_id = a.id
             WHERE e.entity_type = 'messages' AND a.tenant_id = $1`,
            [tenantId]
        );
        const totalEmails = parseInt(emailsCountRes.rows[0]?.count || '0', 10);

        // 2. Phishing emails count
        const phishingCountRes = await pool.query(
            `SELECT COUNT(*) as count FROM corsair_entities e
             JOIN corsair_accounts a ON e.account_id = a.id
             WHERE e.entity_type = 'messages' AND a.tenant_id = $1 AND (e.data->'phishingAnalysis'->>'isPhishing')::boolean = true`,
            [tenantId]
        );
        const phishingEmails = parseInt(phishingCountRes.rows[0]?.count || '0', 10);

        // 3. Pending drafts count
        const pendingDraftsRes = await pool.query(
            `SELECT COUNT(*) as count FROM telegram_drafts WHERE tenant_id = $1 AND status = 'pending'`,
            [tenantId]
        );
        const pendingDrafts = parseInt(pendingDraftsRes.rows[0]?.count || '0', 10);

        // 4. Scheduled events count
        const eventsCountRes = await pool.query(
            `SELECT COUNT(*) as count FROM corsair_entities e
             JOIN corsair_accounts a ON e.account_id = a.id
             WHERE e.entity_type = 'events' AND a.tenant_id = $1`,
            [tenantId]
        );
        const totalEvents = parseInt(eventsCountRes.rows[0]?.count || '0', 10);

        // 5. Generate daily email volume chart data for the last 7 days
        const chartRes = await pool.query(
            `SELECT to_char(e.created_at, 'YYYY-MM-DD') as date,
                    COUNT(*) FILTER (WHERE e.entity_type = 'messages') as emails,
                    COUNT(*) FILTER (WHERE e.entity_type = 'events') as meetings
             FROM corsair_entities e
             JOIN corsair_accounts a ON e.account_id = a.id
             WHERE a.tenant_id = $1 AND e.created_at >= NOW() - INTERVAL '7 days'
             GROUP BY to_char(e.created_at, 'YYYY-MM-DD')
             ORDER BY date ASC`,
            [tenantId]
        );

        const chartData = chartRes.rows.map(row => ({
            date: row.date,
            emails: parseInt(row.emails || '0', 10),
            meetings: parseInt(row.meetings || '0', 10)
        }));

        // Default mock timeline for demo representation if empty
        const finalChartData = chartData.length > 0 ? chartData : [
            { date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString().split('T')[0], emails: 4, meetings: 1 },
            { date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0], emails: 8, meetings: 2 },
            { date: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString().split('T')[0], emails: 5, meetings: 3 },
            { date: new Date().toISOString().split('T')[0], emails: totalEmails, meetings: totalEvents }
        ];

        return new Response(JSON.stringify({
            stats: {
                totalEmails,
                phishingEmails,
                pendingDrafts,
                totalEvents
            },
            chartData: finalChartData
        }), { status: 200 });
    } catch (err: any) {
        console.error('Failed to load dashboard stats:', err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

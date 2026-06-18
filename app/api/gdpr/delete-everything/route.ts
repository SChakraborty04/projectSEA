import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { pool } from "@/db";
import { corsair } from "@/lib/corsair";

/**
 * POST /api/gdpr/delete-everything
 *
 * Full GDPR Art. 17 "Right to be Forgotten" endpoint.
 * Deletes ALL user data across every table and revokes all Google integrations:
 *
 * 1. Stop Gmail Pub/Sub watch
 * 2. Stop Google Calendar webhook channel
 * 3. Revoke Google OAuth tokens
 * 4. Delete telegram_drafts (by tenantId)
 * 5. Delete corsair_events (via corsair_accounts)
 * 6. Delete corsair_entities (via corsair_accounts)
 * 7. Delete corsair_accounts (by tenantId)
 * 8. Delete user_daily_contexts (CASCADE)
 * 9. Delete agent_profiles
 * 10. Delete account (OAuth tokens, CASCADE)
 * 11. Delete session (CASCADE)
 * 12. Delete user record
 */
export async function POST() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const errors: string[] = [];

  // ── 1. Stop Gmail Pub/Sub watch ──
  try {
    const client = corsair.withTenant(userId);
    const gmailToken = await (client as any).gmail?.keys?.get_access_token().catch(() => null);
    if (gmailToken) {
      const stopRes = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/stop",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${gmailToken}` },
        }
      );
      if (!stopRes.ok) {
        const errText = await stopRes.text().catch(() => "unknown");
        errors.push(`gmail_stop: ${errText}`);
      }
    }
  } catch (err: any) {
    errors.push(`gmail_stop: ${err.message || String(err)}`);
  }

  // ── 2. Stop Google Calendar webhook channel ──
  try {
    const client = corsair.withTenant(userId);
    const calToken = await (client as any).googlecalendar?.keys?.get_access_token().catch(() => null);
    if (calToken) {
      // We need the channel ID to stop it. Try to find it from the DB or just
      // attempt to stop all channels by querying the watch endpoint.
      // Google Calendar doesn't list channels, so we try a best-effort stop.
      // The channel will expire on its own, but we attempt cleanup.
      const channelsRes = await pool.query(
        `SELECT config FROM corsair_accounts WHERE tenant_id = $1 AND integration_id = 'googlecalendar' LIMIT 1`,
        [userId]
      );
      if (channelsRes.rows.length > 0) {
        const config = channelsRes.rows[0].config;
        if (config && typeof config === "object") {
          const channelId = (config as any).channelId;
          const resourceId = (config as any).resourceId;
          if (channelId && resourceId) {
            const stopRes = await fetch(
              "https://www.googleapis.com/calendar/v3/channels/stop",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${calToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ id: channelId, resourceId }),
              }
            );
            if (!stopRes.ok) {
              const errText = await stopRes.text().catch(() => "unknown");
              errors.push(`calendar_stop: ${errText}`);
            }
          }
        }
      }
    }
  } catch (err: any) {
    errors.push(`calendar_stop: ${err.message || String(err)}`);
  }

  // ── 3. Revoke Google OAuth tokens ──
  try {
    const accountsRes = await pool.query(
      `SELECT access_token, refresh_token FROM account WHERE user_id = $1 AND provider_id = 'google'`,
      [userId]
    );
    for (const row of accountsRes.rows) {
      const token = row.refresh_token || row.access_token;
      if (token) {
        const revokeRes = await fetch(
          `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          }
        );
        if (!revokeRes.ok && revokeRes.status !== 400) {
          // 400 means token was already invalid/expired, which is fine
          const errText = await revokeRes.text().catch(() => "unknown");
          errors.push(`token_revoke: ${errText}`);
        }
      }
    }
  } catch (err: any) {
    errors.push(`token_revoke: ${err.message || String(err)}`);
  }

  // ── 4-12. Delete all DB records ──
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 4. Delete telegram drafts
    await client.query(`DELETE FROM telegram_drafts WHERE tenant_id = $1`, [userId]);

    // Get all corsair account IDs for this user
    const accountRows = await client.query(
      `SELECT id FROM corsair_accounts WHERE tenant_id = $1`,
      [userId]
    );
    const accountIds = accountRows.rows.map((r: any) => r.id);

    if (accountIds.length > 0) {
      const idList = accountIds.map((_: any, i: number) => `$${i + 1}`).join(", ");

      // 5. Delete corsair events
      await client.query(
        `DELETE FROM corsair_events WHERE account_id IN (${idList})`,
        accountIds
      );

      // 6. Delete corsair entities (emails, calendar events, etc.)
      await client.query(
        `DELETE FROM corsair_entities WHERE account_id IN (${idList})`,
        accountIds
      );
    }

    // 7. Delete corsair accounts
    await client.query(`DELETE FROM corsair_accounts WHERE tenant_id = $1`, [userId]);

    // 8. Delete user daily contexts
    await client.query(`DELETE FROM user_daily_contexts WHERE user_id = $1`, [userId]);

    // 9. Delete agent profile
    await client.query(`DELETE FROM agent_profiles WHERE user_id = $1`, [userId]);

    // 10. Delete OAuth account records (access tokens, refresh tokens)
    await client.query(`DELETE FROM account WHERE user_id = $1`, [userId]);

    // 11. Delete sessions
    await client.query(`DELETE FROM session WHERE user_id = $1`, [userId]);

    // 12. Delete user record
    await client.query(`DELETE FROM "user" WHERE id = $1`, [userId]);

    await client.query("COMMIT");
  } catch (dbErr: any) {
    await client.query("ROLLBACK");
    console.error("[GDPR delete] Database transaction failed:", dbErr);
    return NextResponse.json(
      { error: "Failed to delete user data", detail: dbErr.message || String(dbErr) },
      { status: 500 }
    );
  } finally {
    client.release();
  }

  if (errors.length > 0) {
    console.warn("[GDPR delete] Partial errors:", errors);
  }

  return NextResponse.json({
    success: true,
    message: "All user data has been permanently deleted.",
    warnings: errors.length > 0 ? errors : undefined,
  });
}

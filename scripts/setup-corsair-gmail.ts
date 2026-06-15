/**
 * One-time setup script: stores the Google Cloud Pub/Sub topic_id into
 * Corsair's integration-level credentials so the Gmail plugin knows which
 * topic to reference in users.watch calls.
 *
 * Run once:  pnpm tsx scripts/setup-corsair-gmail.ts
 */
import { corsair } from '../lib/corsair';

const TOPIC_ID = 'projects/superea-499107/topics/superea-webhooks';

async function main() {
    console.log('Setting Gmail topic_id in Corsair integration credentials…');

    const current = await (corsair as any).keys.gmail.get_topic_id().catch(() => null);
    console.log('Current topic_id:', current ?? '(not set)');

    await (corsair as any).keys.gmail.set_topic_id(TOPIC_ID);
    const updated = await (corsair as any).keys.gmail.get_topic_id();
    console.log('Updated topic_id:', updated);
    console.log('Done ✓');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});

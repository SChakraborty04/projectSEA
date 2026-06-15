import fs from 'fs';
import path from 'path';

try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const lines = envContent.split('\n');
        for (const line of lines) {
            const match = line.match(/^\s*DATABASE_URL\s*=\s*["']?(.*?)["']?\s*$/);
            if (match) {
                process.env.DATABASE_URL = match[1];
                break;
            }
        }
    }
} catch (e) {}

async function main() {
    const { pool } = await import('../db/index');
    
    try {
        const resTypes = await pool.query(
            `SELECT entity_type, COUNT(*) as count 
             FROM corsair_entities 
             GROUP BY entity_type`
        );
        console.log("Entity types in DB:");
        resTypes.rows.forEach((r: any) => {
            console.log(`- Type: ${r.entity_type} | Count: ${r.count}`);
        });

        const resLatestEvents = await pool.query(
            `SELECT entity_id, entity_type, created_at, data 
             FROM corsair_entities 
             WHERE entity_type = 'events'
             ORDER BY created_at DESC 
             LIMIT 3`
        );
        console.log("\nLatest 3 events in DB:");
        resLatestEvents.rows.forEach((r: any) => {
            console.log(`- ID: ${r.entity_id} | Created: ${r.created_at}`);
            console.log("  Data Keys:", Object.keys(r.data || {}));
            console.log("  Summary:", r.data?.summary || 'N/A');
        });
    } catch (error) {
        console.error(error);
    } finally {
        await pool.end();
    }
}

main();

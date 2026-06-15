import 'dotenv/config';
import { pool } from './db/index.js';
import { corsair } from './lib/corsair.js';

async function main() {
    try {
        console.log('Testing Corsair Integrations');
        const res = await pool.query('SELECT * FROM corsair_integrations');
        console.log('Integrations:', JSON.stringify(res.rows, null, 2));
        process.exit(0);
        console.log('Accounts:', accRes.rows);

        // Dummy tenant
        const tenantId = 'b62TEs34KjYgW3IkrEaYRqnEywIcg8Dy';
        const client = corsair.withTenant(tenantId);
        
        console.log('Attempting to use telegram client...');
        await client.telegram.api.me.getMe({});
        console.log('Success!');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await pool.end();
    }
}

main();

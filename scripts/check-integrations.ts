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
        const res = await pool.query(`SELECT * FROM corsair_integrations`);
        
        console.log("Integrations:");
        res.rows.forEach((r: any) => {
            console.log(`- ID: ${r.id} | Name: ${r.name}`);
        });
    } catch (error) {
        console.error(error);
    } finally {
        await pool.end();
    }
}

main();

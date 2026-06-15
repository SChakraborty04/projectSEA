import fs from 'fs';
import path from 'path';

// Read .env file manually
try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const lines = envContent.split('\n');
        for (const line of lines) {
            const match = line.match(/^\s*DATABASE_URL\s*=\s*["']?(.*?)["']?\s*$/);
            if (match) {
                process.env.DATABASE_URL = match[1];
                console.log('Loaded DATABASE_URL from .env file.');
                break;
            }
        }
    } else {
        console.warn('.env file not found at:', envPath);
    }
} catch (e) {
    console.error('Failed to parse .env file:', e);
}

async function main() {
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL is not set in env or .env file!');
        process.exit(1);
    }

    console.log('Connecting to database to clear event and entity caches...');
    
    // Dynamically import pool after env variable is set
    const { pool } = await import('../db/index');
    
    // We truncate corsair_events and corsair_entities.
    // TRUNCATE releases physical disk space immediately in PostgreSQL.
    // CASCADE ensures dependent foreign key constraints (if any) are handled.
    const query = 'TRUNCATE TABLE corsair_events, corsair_entities CASCADE;';
    
    try {
        console.log('Running TRUNCATE query...');
        await pool.query(query);
        console.log('Successfully cleared corsair_events and corsair_entities tables! Disk space reclaimed. ✓');
    } catch (error) {
        console.error('Failed to truncate tables:', error);
    } finally {
        await pool.end();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});

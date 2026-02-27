require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error('ERROR: DATABASE_URL environment variable is not set.');
        process.exit(1);
    }

    const client = new Client({ connectionString: databaseUrl });
    await client.connect();

    const sqlPath = path.join(__dirname, 'postgis-setup.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('Applying PostGIS setup...');
    await client.query(sql);
    console.log('✅ PostGIS setup complete (extension, columns, indexes, triggers).');

    await client.end();
}

main().catch((err) => {
    console.error('PostGIS setup failed:', err);
    process.exit(1);
});

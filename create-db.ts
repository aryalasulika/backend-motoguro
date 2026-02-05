import { Client } from 'pg';

const client = new Client({
  connectionString: 'postgres://postgres:admin@localhost:5432/postgres', // Connect to default DB
});

async function createDb() {
  try {
    await client.connect();
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'motoguro_db'");
    if (res.rowCount === 0) {
      await client.query('CREATE DATABASE motoguro_db');
      console.log('Database motoguro_db created successfully.');
    } else {
      console.log('Database motoguro_db already exists.');
    }
  } catch (err) {
    console.error('Error creating database:', err);
  } finally {
    await client.end();
  }
}

createDb();

import postgres from 'postgres';

async function testConnection() {
  console.log("Connecting to Supabase Postgres via Pooler...");
  const sql = postgres({
    host: 'aws-0-eu-central-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    username: 'postgres.ueazjqvxjlppgtkhcmut',
    password: 'Ars4655789023',
    ssl: 'require',
    connect_timeout: 10
  });
  try {
    const result = await sql`SELECT NOW()`;
    console.log("SUCCESS! Connected to database. Server time:", result[0].now);
    const products = await sql`SELECT COUNT(*), MIN(name) FROM public.products`;
    console.log("Products count in DB:", products[0].count, "First product:", products[0].min);
  } catch (err) {
    console.error("CONNECTION FAILED:", err.message);
  } finally {
    await sql.end();
  }
}

testConnection();

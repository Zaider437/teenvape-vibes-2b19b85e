import postgres from 'postgres';

async function testConnection() {
  console.log("Connecting to Supabase Postgres via DATABASE_URL...");
  const connectionString = "postgresql://postgres:Ars4655789023@db.ueazjqvxjlppgtkhcmut.supabase.co:5432/postgres";
  console.log("DATABASE_URL:", connectionString);
  const sql = postgres(connectionString, { ssl: 'require', connect_timeout: 10 });
  try {
    const result = await sql`SELECT NOW()`;
    console.log("SUCCESS! Connected to database. Server time:", result[0].now);
  } catch (err) {
    console.error("CONNECTION FAILED:", err.message);
  } finally {
    await sql.end();
  }
}

testConnection();

import postgres from "postgres";

const regions = [
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "eu-central-1",
  "eu-central-2",
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "ap-southeast-1",
  "ap-northeast-1",
  "ca-central-1",
  "sa-east-1",
  "ap-south-1",
];

async function testRegions() {
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    console.log(`Trying region: ${region} (${host})...`);
    const sql = postgres({
      host,
      port: 6543,
      database: "postgres",
      username: "postgres.ueazjqvxjlppgtkhcmut",
      password: "Ars4655789023",
      ssl: "require",
      connect_timeout: 3,
    });
    try {
      const result = await sql`SELECT NOW()`;
      console.log(`SUCCESS in region ${region}! Server time:`, result[0].now);
      break;
    } catch (err) {
      console.log(`FAILED in region ${region}:`, err.message);
    } finally {
      await sql.end();
    }
  }
}

testRegions();

import https from 'https';

const SUPABASE_URL = 'https://ueazjqvxjlppgtkhcmut.supabase.co';
const SUPABASE_SECRET = 'sb_secret_LzJIRzi7EsB-b2bZaAtYUg_juFQG2YL';

const updates = [
  { id: '6b70ee3e-dc87-4ac5-8d37-9e3c029d220c', url: 'https://ueazjqvxjlppgtkhcmut.supabase.co/storage/v1/object/public/product-images/pink-textured.jpg' },
  { id: '952ec4cd-4fd6-4fe2-a7c2-cd17ec990ac1', url: 'https://ueazjqvxjlppgtkhcmut.supabase.co/storage/v1/object/public/product-images/red.jpg' },
];

function patchProduct(id, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const options = {
      hostname: new URL(SUPABASE_URL).hostname,
      path: `/rest/v1/products?id=eq.${id}`,
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SECRET,
        'Authorization': `Bearer ${SUPABASE_SECRET}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode || 0, body: Buffer.concat(chunks).toString() }));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  for (const u of updates) {
    const result = await patchProduct(u.id, { image_url: u.url });
    if (result.status >= 200 && result.status < 300) {
      console.log(`✓ Updated ${u.id}: ${u.url}`);
    } else {
      console.error(`✗ Failed to update ${u.id}: ${result.status} ${result.body}`);
    }
  }
}

main().catch(console.error);

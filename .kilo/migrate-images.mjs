import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CDN_BASE = 'https://50d1377c-9372-4b5d-9572-ca74753c6750.lovableproject.com';
const SUPABASE_URL = 'https://ueazjqvxjlppgtkhcmut.supabase.co';
const SUPABASE_SECRET = 'sb_secret_LzJIRzi7EsB-b2bZaAtYUg_juFQG2YL';
const BUCKET = 'product-images';

const IMAGES = [
  '/__l5e/assets-v1/01e435be-9ddb-4248-ab39-2ba834b59b18/corex-08.jpg',
  '/__l5e/assets-v1/1d0516ca-c48e-44e0-92bf-933ca2723c76/black.jpg',
  '/__l5e/assets-v1/1fe761cc-a6cc-4ade-9d38-257f7835e99a/lilac.jpg',
  '/__l5e/assets-v1/29d86675-4455-4c51-9a92-b8174a60b16a/purple.jpg',
  '/__l5e/assets-v1/2fc70060-bafe-4e6b-83f9-94767e57c234/green.jpg',
  '/__l5e/assets-v1/3f889220-4468-4e89-b58e-45d3532c6044/lilac.jpg',
  '/__l5e/assets-v1/61b1a146-cb10-47e6-b6b6-e695b900404a/corex-04.jpg',
  '/__l5e/assets-v1/692be097-3c27-4f2e-a4ea-b78d119a1fa9/pink-textured.jpg',
  '/__l5e/assets-v1/91ff1f1b-1cc9-4039-9f88-d5d0110cb4d9/sky.jpg',
  '/__l5e/assets-v1/a19dae12-c39e-404a-ac52-350939d3171e/purple.jpg',
  '/__l5e/assets-v1/a38c5139-3c0a-41f3-ad44-111005ac2a26/silver.jpg',
  '/__l5e/assets-v1/a967e1fb-0134-4b12-bf7f-60f42a1d129c/barr.jpg',
  '/__l5e/assets-v1/b9342734-9b75-4074-b4ee-2bbdce393412/pink.jpg',
  '/__l5e/assets-v1/ca3840a5-131a-4a2e-9ea7-410c7f09d391/mint.jpg',
  '/__l5e/assets-v1/ca4e2ded-8d72-4be4-8b69-fbeb775640c8/red.jpg',
  '/__l5e/assets-v1/cbd474cc-ea80-418c-a78a-9a0a338e0d13/carbon.jpg',
  '/__l5e/assets-v1/cd68bafb-105c-4925-b302-a152dcab95cb/white.jpg',
  '/__l5e/assets-v1/d14a93d7-9464-4d48-9cdd-f6f4d05cb75f/ice-blue.jpg',
  '/__l5e/assets-v1/f3ad75f7-a18d-4f1e-a273-f9e93e7a5cd9/corex-06.jpg',
  '/__l5e/assets-v1/f4976e1c-352f-41f2-aedc-a8ec7bd2c0ce/pink.jpg',
];

const outDir = path.join(__dirname, '..', 'product-images');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function httpsPost(url, body, headers) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        ...headers,
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

async function uploadToSupabase(filePath, fileName) {
  const fileBuffer = fs.readFileSync(filePath);
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURIComponent(fileName)}`;
  
  const result = await httpsPost(uploadUrl, fileBuffer, {
    'Authorization': `Bearer ${SUPABASE_SECRET}`,
    'apikey': SUPABASE_SECRET,
  });

  if (result.status >= 200 && result.status < 300) {
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(fileName)}`;
    console.log(`✓ Uploaded: ${fileName}`);
    return publicUrl;
  } else {
    console.error(`✗ Failed to upload ${fileName}: ${result.status} ${result.body}`);
    return '';
  }
}

async function main() {
  const results = [];
  
  for (const cdnPath of IMAGES) {
    const fileName = path.basename(cdnPath);
    const localPath = path.join(outDir, fileName);
    const fullUrl = `${CDN_BASE}${cdnPath}`;
    
    console.log(`Downloading: ${fileName}`);
    
    try {
      const buffer = await httpsGet(fullUrl);
      fs.writeFileSync(localPath, buffer);
      console.log(`  Downloaded: ${buffer.length} bytes`);
      
      const publicUrl = await uploadToSupabase(localPath, fileName);
      if (publicUrl) {
        results.push({ cdnPath, fileName, publicUrl });
      }
    } catch (err) {
      console.error(`  Error: ${err}`);
    }
  }
  
  console.log('\n=== RESULTS ===');
  for (const r of results) {
    console.log(`${r.cdnPath}\n  -> ${r.publicUrl}\n`);
  }
  
  fs.writeFileSync(path.join(outDir, 'results.json'), JSON.stringify(results, null, 2));
  console.log(`\nSaved results to ${path.join(outDir, 'results.json')}`);
}

main().catch(console.error);

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://ueazjqvxjlppgtkhcmut.supabase.co';
const supabaseKey = 'sb_secret_LzJIRzi7EsB-b2bZaAtYUg_juFQG2YL';
  
  
}const supabase = createClient(supabaseUrl, supabaseKey);

async function importFromMigration() {
  console.log("Reading migration file...");
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20260708183506_1afb82cb-b924-4b2a-ba8f-f7698439e4fc.sql');
  const content = fs.readFileSync(migrationPath, 'utf-8');

  // Find all INSERT INTO public.products statements
  const regex = /INSERT INTO public\.products \([^)]+\) VALUES([\s\S]+?);/g;
  let match;
  const products = [];

  while ((match = regex.exec(content)) !== null) {
    const valuesBlock = match[1];
    const lines = valuesBlock.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    for (const line of lines) {
      const cleanLine = line.replace(/^\(/, '').replace(/,?\)?$/, '').trim();
      if (!cleanLine) continue;

      const parts = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < cleanLine.length; i++) {
        const char = cleanLine[i];
        if (char === "'" && cleanLine[i - 1] !== "\\") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          parts.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      parts.push(current.trim());

      const cleanVal = (val) => {
        if (val === 'NULL' || val === 'null') return null;
        if (val.startsWith("'") && val.endsWith("'")) {
          return val.slice(1, -1).replace(/''/g, "'");
        }
        return val;
      };

      const slug = cleanVal(parts[0]);
      const name = cleanVal(parts[1]);
      const brand = cleanVal(parts[2]);
      const category = cleanVal(parts[3]);
      const price = parseFloat(cleanVal(parts[4]) || '0');
      const flavor = cleanVal(parts[5]);
      const puffs = cleanVal(parts[6]);
      const volume = cleanVal(parts[7]);
      const emoji = cleanVal(parts[8]) || '🔥';
      const color = cleanVal(parts[9]) || 'pink';
      const image_url = cleanVal(parts[10]);
      const sort_order = parseInt(cleanVal(parts[11]) || '0', 10);

      if (slug && name) {
        products.push({
          slug, name, brand, category, price, flavor, puffs, volume, emoji, color, image_url, sort_order
        });
      }
    }
  }

  console.log(`Parsed ${products.length} products from migration file.`);

  let inserted = 0;
  let updated = 0;

  for (const product of products) {
    const { data: existing, error: fetchError } = await supabase
      .from('products')
      .select('id')
      .eq('slug', product.slug);

    if (fetchError) {
      console.error(`Error fetching product ${product.slug}:`, fetchError.message);
      continue;
    }

    const payload = {
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      category: product.category,
      price: product.price,
      flavor: product.flavor,
      puffs: product.puffs,
      volume: product.volume,
      emoji: product.emoji,
      color: product.color,
      image_url: product.image_url,
      is_active: true,
      sort_order: product.sort_order,
      updated_at: new Date().toISOString()
    };

    if (existing && existing.length > 0) {
      const { error: updateError } = await supabase
        .from('products')
        .update(payload)
        .eq('slug', product.slug);

      if (updateError) {
        console.error(`Error updating product ${product.slug}:`, updateError.message);
      } else {
        updated++;
      }
    } else {
      const { error: insertError } = await supabase
        .from('products')
        .insert(payload);

      if (insertError) {
        console.error(`Error inserting product ${product.slug}:`, insertError.message);
      } else {
        inserted++;
      }
    }
  }

  console.log(`SUCCESS! Imported products. Inserted: ${inserted}, Updated: ${updated}`);
}

importFromMigration();

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ueazjqvxjlppgtkhcmut.supabase.co";
const supabaseKey = "sb_secret_LzJIRzi7EsB-b2bZaAtYUg_juFQG2YL";
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: products, error } = await supabase
    .from("products")
    .select("name, slug, brand, category, price")
    .eq("category", "liquid")
    .limit(50);

  if (error) {
    console.error("Error:", error.message);
    return;
  }

  console.log("Sample liquids details:");
  for (const p of products) {
    console.log(`Name: ${p.name} | Slug: ${p.slug} | Brand: ${p.brand} | Price: ${p.price}`);
  }
}

run();

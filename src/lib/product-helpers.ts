const PUBLIC_IMAGE_CDN_BASE =
  (globalThis as any).env?.PUBLIC_IMAGE_CDN_BASE ||
  (globalThis as any).__env__?.PUBLIC_IMAGE_CDN_BASE ||
  "https://ueazjqvxjlppgtkhcmut.supabase.co/storage/v1/object/public/product-images";

export function formatImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  if (url.startsWith("/assets/")) return url;
  const fileName = url.startsWith("/__l5e/")
    ? url.split("/").pop()
    : url.split("/").pop() || url.replace(/^\//, "");
  return `${PUBLIC_IMAGE_CDN_BASE}/${encodeURIComponent(fileName || "")}?width=400&quality=80&format=webp`;
}

export function buildDescription(p: {
  category?: string | null;
  brand?: string | null;
  flavor?: string | null;
  puffs?: string | null;
  volume?: string | null;
  description?: string | null;
}): string {
  if (p.description && p.description.trim()) return p.description.trim();
  const brand = p.brand || "";
  const lines: string[] = [];
  if (p.category === "disposable") {
    lines.push(`Одноразовая POD-система ${brand}.`);
    if (p.flavor) lines.push(`Вкус: ${p.flavor}`);
    if (p.puffs) lines.push(p.puffs);
    lines.push(p.volume ? `Объём жидкости: ${p.volume}` : "Объём жидкости: 12–18 мл");
    lines.push("Ёмкость аккумулятора: 500–650 mAh");
    lines.push("Сетчатый испаритель (mesh) для насыщенного вкуса");
  } else if (p.category === "liquid") {
    lines.push(`Жидкость для POD-систем ${brand}.`);
    if (p.flavor) lines.push(`Вкус: ${p.flavor}`);
    lines.push(p.volume ? `Объём / крепость: ${p.volume}` : "Объём: 30 мл · крепость 20 мг");
    lines.push("Соотношение PG/VG: 50/50 — для солевых никотинов");
    lines.push("Подходит для маломощных POD-устройств");
  } else if (p.category === "device") {
    lines.push(`POD-устройство ${brand}.`);
    if (p.flavor) lines.push(`Цвет: ${p.flavor}`);
    lines.push("Ёмкость аккумулятора: до 1000–2000 mAh");
    lines.push("Объём картриджа: 2–4 мл");
    lines.push("Регулировка затяжки и мощности");
  } else if (p.category === "consumable") {
    lines.push(`Расходник для ${brand}.`);
    if (p.flavor) lines.push(p.flavor);
    if (p.volume) lines.push(p.volume);
  } else {
    if (brand) lines.push(brand);
    if (p.flavor) lines.push(p.flavor);
  }
  return lines.filter(Boolean).join("\n");
}

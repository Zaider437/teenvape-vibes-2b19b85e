import { buildDescription, formatImageUrl } from "./product-helpers";
import silver from "@/assets/xros5mini/silver.jpg.asset.json";
import iceBlue from "@/assets/xros5mini/ice-blue.jpg.asset.json";
import carbon from "@/assets/xros5mini/carbon.jpg.asset.json";
import black from "@/assets/xros5mini/black.jpg.asset.json";
import pink from "@/assets/xros5mini/pink.jpg.asset.json";
import sky from "@/assets/xros5mini/sky.jpg.asset.json";
import purple from "@/assets/xros5mini/purple.jpg.asset.json";
import pinkTextured from "@/assets/xros5mini/pink-textured.jpg.asset.json";
import white from "@/assets/xros5mini/white.jpg.asset.json";
import x5Purple from "@/assets/xros5/purple.jpg.asset.json";
import x5Lilac from "@/assets/xros5/lilac.jpg.asset.json";
import x5Mint from "@/assets/xros5/mint.jpg.asset.json";
import x5Red from "@/assets/xros5/red.jpg.asset.json";
import xp2Pink from "@/assets/xrospro2/pink.jpg.asset.json";
import xp2Green from "@/assets/xrospro2/green.jpg.asset.json";
import xp2Lilac from "@/assets/xrospro2/lilac.jpg.asset.json";
import podBarr from "@/assets/pods/barr.jpg.asset.json";
import podCorex06 from "@/assets/pods/corex-06.jpg.asset.json";
import podCorex08 from "@/assets/pods/corex-08.jpg.asset.json";
import podCorex04 from "@/assets/pods/corex-04.jpg.asset.json";

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: "device" | "disposable" | "liquid" | "consumable" | "snus" | string;
  price: number;
  flavor?: string | null;
  puffs?: string | null;
  volume?: string | null;
  emoji: string;
  color: "lime" | "pink" | "cyan" | string;
  image?: string | null;
  in_stock: boolean;
  sort_order: number;
  description?: string | null;
};

export const PRODUCTS: Product[] = [
  {
    id: "d1",
    slug: "d1",
    name: "Elf Bar BC5000",
    brand: "Elf Bar",
    category: "disposable",
    price: 22,
    flavor: "Голубика Лёд",
    puffs: "5000 затяжек",
    emoji: "💨",
    color: "cyan",
    in_stock: true,
    sort_order: 10,
    description: "",
  },
  {
    id: "d2",
    slug: "d2",
    name: "Lost Mary OS5000",
    brand: "Lost Mary",
    category: "disposable",
    price: 24,
    flavor: "Клубника Киви",
    puffs: "5000 затяжек",
    emoji: "🍓",
    color: "pink",
    in_stock: true,
    sort_order: 20,
    description: "",
  },
  {
    id: "d3",
    slug: "d3",
    name: "HQD Cuvie Plus",
    brand: "HQD",
    category: "disposable",
    price: 15,
    flavor: "Манго Айс",
    puffs: "1200 затяжек",
    emoji: "🥭",
    color: "lime",
    in_stock: true,
    sort_order: 30,
    description: "",
  },
  {
    id: "d4",
    slug: "d4",
    name: "Waka SoPro 10000",
    brand: "Waka",
    category: "disposable",
    price: 32,
    flavor: "Арбуз Мята",
    puffs: "10000 затяжек",
    emoji: "🍉",
    color: "lime",
    in_stock: true,
    sort_order: 40,
    description: "",
  },
  {
    id: "v1-pink",
    slug: "v1-pink",
    name: "Vaporesso XROS Pro 2 — Pink",
    brand: "Vaporesso",
    category: "device",
    price: 90,
    flavor: "Pink",
    emoji: "⚡",
    color: "pink",
    image: xp2Pink.url,
    in_stock: true,
    sort_order: 110,
    description: "",
  },
  {
    id: "v1-green",
    slug: "v1-green",
    name: "Vaporesso XROS Pro 2 — Green",
    brand: "Vaporesso",
    category: "device",
    price: 90,
    flavor: "Green",
    emoji: "⚡",
    color: "lime",
    image: xp2Green.url,
    in_stock: true,
    sort_order: 111,
    description: "",
  },
  {
    id: "v1-lilac",
    slug: "v1-lilac",
    name: "Vaporesso XROS Pro 2 — Lilac",
    brand: "Vaporesso",
    category: "device",
    price: 90,
    flavor: "Lilac",
    emoji: "⚡",
    color: "pink",
    image: xp2Lilac.url,
    in_stock: true,
    sort_order: 112,
    description: "",
  },
  {
    id: "v2",
    slug: "v2",
    name: "SMOK Novo 4",
    brand: "SMOK",
    category: "device",
    price: 48,
    emoji: "🔥",
    color: "pink",
    in_stock: true,
    sort_order: 120,
    description: "",
  },
  {
    id: "v3",
    slug: "v3",
    name: "GeekVape Wenax K1",
    brand: "GeekVape",
    category: "device",
    price: 42,
    emoji: "💎",
    color: "lime",
    in_stock: true,
    sort_order: 130,
    description: "",
  },
  {
    id: "v4-silver",
    slug: "v4-silver",
    name: "Vaporesso XROS 5 Mini — Silver",
    brand: "Vaporesso",
    category: "device",
    price: 55,
    flavor: "Silver",
    emoji: "⚡",
    color: "cyan",
    image: silver.url,
    in_stock: true,
    sort_order: 140,
    description: "",
  },
  {
    id: "v4-iceblue",
    slug: "v4-iceblue",
    name: "Vaporesso XROS 5 Mini — Ice Blue",
    brand: "Vaporesso",
    category: "device",
    price: 55,
    flavor: "Ice Blue",
    emoji: "⚡",
    color: "cyan",
    image: iceBlue.url,
    in_stock: true,
    sort_order: 141,
    description: "",
  },
  {
    id: "v4-carbon",
    slug: "v4-carbon",
    name: "Vaporesso XROS 5 Mini — Carbon",
    brand: "Vaporesso",
    category: "device",
    price: 55,
    flavor: "Carbon Black",
    emoji: "⚡",
    color: "cyan",
    image: carbon.url,
    in_stock: true,
    sort_order: 142,
    description: "",
  },
  {
    id: "v4-black",
    slug: "v4-black",
    name: "Vaporesso XROS 5 Mini — Black",
    brand: "Vaporesso",
    category: "device",
    price: 55,
    flavor: "Black Wave",
    emoji: "⚡",
    color: "cyan",
    image: black.url,
    in_stock: true,
    sort_order: 143,
    description: "",
  },
  {
    id: "v4-pink",
    slug: "v4-pink",
    name: "Vaporesso XROS 5 Mini — Pink",
    brand: "Vaporesso",
    category: "device",
    price: 55,
    flavor: "Pink",
    emoji: "⚡",
    color: "pink",
    image: "/assets/images/photo_5400171637098879579_x.jpg",
    in_stock: true,
    sort_order: 144,
    description: "",
  },
  {
    id: "v4-sky",
    slug: "v4-sky",
    name: "Vaporesso XROS 5 Mini — Sky Blue",
    brand: "Vaporesso",
    category: "device",
    price: 55,
    flavor: "Sky Blue",
    emoji: "⚡",
    color: "cyan",
    image: sky.url,
    in_stock: true,
    sort_order: 145,
    description: "",
  },
  {
    id: "v4-purple",
    slug: "v4-purple",
    name: "Vaporesso XROS 5 Mini — Purple",
    brand: "Vaporesso",
    category: "device",
    price: 55,
    flavor: "Purple",
    emoji: "⚡",
    color: "pink",
    image: "/assets/images/photo_5400171637098879578_x.jpg",
    in_stock: true,
    sort_order: 146,
    description: "",
  },
  {
    id: "v4-pinktex",
    slug: "v4-pinktex",
    name: "Vaporesso XROS 5 Mini — Pink Textured",
    brand: "Vaporesso",
    category: "device",
    price: 55,
    flavor: "Pink Textured",
    emoji: "⚡",
    color: "pink",
    image: pinkTextured.url,
    in_stock: true,
    sort_order: 147,
    description: "",
  },
  {
    id: "v4-white",
    slug: "v4-white",
    name: "Vaporesso XROS 5 Mini — White",
    brand: "Vaporesso",
    category: "device",
    price: 55,
    flavor: "White",
    emoji: "⚡",
    color: "cyan",
    image: white.url,
    in_stock: true,
    sort_order: 148,
    description: "",
  },
  {
    id: "v5-purple",
    slug: "v5-purple",
    name: "Vaporesso XROS 5 — Purple",
    brand: "Vaporesso",
    category: "device",
    price: 65,
    flavor: "Purple",
    emoji: "⚡",
    color: "pink",
    image: x5Purple.url,
    in_stock: true,
    sort_order: 150,
    description: "",
  },
  {
    id: "v5-lilac",
    slug: "v5-lilac",
    name: "Vaporesso XROS 5 — Lilac",
    brand: "Vaporesso",
    category: "device",
    price: 65,
    flavor: "Lilac Textured",
    emoji: "⚡",
    color: "pink",
    image: x5Lilac.url,
    in_stock: true,
    sort_order: 151,
    description: "",
  },
  {
    id: "v5-mint",
    slug: "v5-mint",
    name: "Vaporesso XROS 5 — Mint",
    brand: "Vaporesso",
    category: "device",
    price: 65,
    flavor: "Mint",
    emoji: "⚡",
    color: "lime",
    image: x5Mint.url,
    in_stock: true,
    sort_order: 152,
    description: "",
  },
  {
    id: "v5-red",
    slug: "v5-red",
    name: "Vaporesso XROS 5 — Red",
    brand: "Vaporesso",
    category: "device",
    price: 65,
    flavor: "Red",
    emoji: "⚡",
    color: "pink",
    image: x5Red.url,
    in_stock: true,
    sort_order: 153,
    description: "",
  },
  {
    id: "l1",
    slug: "l1",
    name: "Jam Monster — Blueberry",
    brand: "Jam Monster",
    category: "liquid",
    price: 18,
    flavor: "Черничный джем",
    volume: "30 мл / 20 мг",
    emoji: "🫐",
    color: "cyan",
    in_stock: true,
    sort_order: 210,
    description: "",
  },
  {
    id: "l2",
    slug: "l2",
    name: "Husky Salt — Ice Cola",
    brand: "Husky",
    category: "liquid",
    price: 16,
    flavor: "Кола со льдом",
    volume: "30 мл / 20 мг",
    emoji: "🥤",
    color: "pink",
    in_stock: true,
    sort_order: 220,
    description: "",
  },
  {
    id: "l3",
    slug: "l3",
    name: "Rell Salt — Watermelon",
    brand: "Rell",
    category: "liquid",
    price: 14,
    flavor: "Арбуз",
    volume: "30 мл / 20 мг",
    emoji: "🍉",
    color: "lime",
    in_stock: true,
    sort_order: 230,
    description: "",
  },
  {
    id: "l4",
    slug: "l4",
    name: "Podonchik — Mango Peach",
    brand: "Podonchik",
    category: "liquid",
    price: 15,
    flavor: "Манго Персик",
    volume: "30 мл / 20 мг",
    emoji: "🍑",
    color: "pink",
    in_stock: true,
    sort_order: 240,
    description: "",
  },
  {
    id: "c2",
    slug: "c2",
    name: "Картридж SMOK Novo",
    brand: "SMOK",
    category: "consumable",
    price: 8,
    flavor: "Пустой картридж",
    volume: "2 мл / 1.0Ω",
    emoji: "🔧",
    color: "pink",
    in_stock: true,
    sort_order: 310,
    description: "",
  },
  {
    id: "c3",
    slug: "c3",
    name: "Испаритель GeekVape B",
    brand: "GeekVape",
    category: "consumable",
    price: 6,
    flavor: "Сменный испаритель",
    volume: "0.6Ω Mesh",
    emoji: "🌀",
    color: "lime",
    in_stock: true,
    sort_order: 320,
    description: "",
  },
  {
    id: "c4",
    slug: "c4",
    name: "Ватка Cotton Bacon",
    brand: "Wick'n'Vape",
    category: "consumable",
    price: 12,
    flavor: "Органический хлопок",
    volume: "10 полос",
    emoji: "☁️",
    color: "lime",
    in_stock: true,
    sort_order: 330,
    description: "",
  },
  {
    id: "c5",
    slug: "c5",
    name: "Vaporesso Barr Pod",
    brand: "Vaporesso",
    category: "consumable",
    price: 10,
    flavor: "Картридж",
    volume: "1.2 мл / 1.2Ω, 1 шт",
    emoji: "🧩",
    color: "cyan",
    image: podBarr.url,
    in_stock: true,
    sort_order: 340,
    description: "",
  },
  {
    id: "c6",
    slug: "c6",
    name: "Vaporesso XROS Corex 2.0 0.6Ω",
    brand: "Vaporesso",
    category: "consumable",
    price: 13,
    flavor: "Mesh Pod",
    volume: "2 мл / 0.6Ω, 1 шт",
    emoji: "🧩",
    color: "lime",
    image: podCorex06.url,
    in_stock: true,
    sort_order: 341,
    description: "",
  },
  {
    id: "c7",
    slug: "c7",
    name: "Vaporesso XROS Corex 2.0 0.8Ω",
    brand: "Vaporesso",
    category: "consumable",
    price: 13,
    flavor: "Mesh Pod",
    volume: "2 мл / 0.8Ω, 1 шт",
    emoji: "🧩",
    color: "lime",
    image: podCorex08.url,
    in_stock: true,
    sort_order: 342,
    description: "",
  },
  {
    id: "c8",
    slug: "c8",
    name: "Vaporesso XROS Corex 2.0 0.4Ω",
    brand: "Vaporesso",
    category: "consumable",
    price: 13,
    flavor: "Mesh Pod",
    volume: "3 мл / 0.4Ω, 1 шт",
    emoji: "🧩",
    color: "lime",
    image: podCorex04.url,
    in_stock: true,
    sort_order: 343,
    description: "",
  },
];

export const CATEGORIES = [
  { id: "all", label: "Всё", emoji: "🔥" },
  { id: "disposable", label: "Одноразки", emoji: "💨" },
  { id: "device", label: "Устройства", emoji: "⚡" },
  { id: "liquid", label: "Жидкости", emoji: "🧪" },
  { id: "consumable", label: "Расходники", emoji: "🧩" },
  { id: "snus", label: "Снюс", emoji: "🍃" },
] as const;

let cachedProducts: Product[] | null = null;
let cachedProductsExpiry = 0;
let cachedMeetingTimes: string[] | null = null;
let cachedMeetingTimesExpiry = 0;

export function invalidateProductsCache() {
  cachedProducts = null;
  cachedProductsExpiry = 0;
  cachedMeetingTimes = null;
  cachedMeetingTimesExpiry = 0;
}

const PUBLIC_IMAGE_CDN_BASE =
  (globalThis as any).env?.PUBLIC_IMAGE_CDN_BASE ||
  (globalThis as any).__env__?.PUBLIC_IMAGE_CDN_BASE ||
  "https://ueazjqvxjlppgtkhcmut.supabase.co/storage/v1/object/public/product-images";

export async function fetchProducts(): Promise<Product[]> {
  const now = Date.now();
  if (cachedProducts && cachedProductsExpiry > now) {
    return cachedProducts;
  }

  const fetchPromise = (async () => {
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase
        .from("products" as any)
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        const mapped = data.map((p: any) => {
          return {
            id: p.id,
            slug: p.slug,
            name: p.name,
            brand: p.brand,
            category: p.category,
            price: p.price,
            flavor: p.flavor,
            puffs: p.puffs,
            volume: p.volume,
            emoji: p.emoji,
            color: p.color,
            image: formatImageUrl(p.image_url),
            in_stock: p.in_stock,
            sort_order: p.sort_order,
            description: buildDescription(p),
          };
        });
        cachedProducts = mapped;
        cachedProductsExpiry = Date.now() + 30 * 1000; // Cache for 30 seconds
        return mapped;
      }
      const fallback = PRODUCTS.map((p) => ({
        ...p,
        image: formatImageUrl(p.image),
        description: buildDescription(p),
      }));
      cachedProducts = fallback;
      cachedProductsExpiry = Date.now() + 30 * 1000;
      return fallback;
    } catch (err) {
      console.warn("[products] Failed to fetch from Supabase, falling back to local PRODUCTS", err);
    }
    const fallback = PRODUCTS.map((p) => ({
      ...p,
      image: formatImageUrl(p.image),
      description: buildDescription(p),
    }));
    cachedProducts = fallback;
    cachedProductsExpiry = Date.now() + 30 * 1000;
    return fallback;
  })();

   const timeoutPromise = new Promise<Product[]>((resolve) =>
    setTimeout(() => {
      console.warn("[products] Supabase fetch timed out, falling back to local PRODUCTS");
      resolve(
        PRODUCTS.map((p) => ({
          ...p,
          image: formatImageUrl(p.image),
          description: buildDescription(p),
        })),
      );
    }, 10000),
  );

  return Promise.race([fetchPromise, timeoutPromise]);
}

export async function fetchMeetingTimes(): Promise<string[]> {
  const now = Date.now();
  if (cachedMeetingTimes && cachedMeetingTimesExpiry > now) {
    return cachedMeetingTimes;
  }

  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await (supabase
      .from("admin_telegram_users" as any)
      .select("note")
      .eq("telegram_username", "__meeting_times__")
      .maybeSingle() as any);

    if (!error && data && data.note) {
      const parsed = JSON.parse(data.note) as string[];
      cachedMeetingTimes = parsed;
      cachedMeetingTimesExpiry = Date.now() + 60 * 1000; // Cache for 1 minute
      return parsed;
    }
  } catch (err) {
    console.warn("[products] Failed to fetch meeting times, using defaults", err);
  }
  const defaults = [
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "20:20",
    "21:00",
    "После 21:00 — отдам там, где буду находиться. Закажите заранее!",
    "Для заказа Яндекс Доставки",
  ];
  cachedMeetingTimes = defaults;
  cachedMeetingTimesExpiry = Date.now() + 60 * 1000;
  return defaults;
}

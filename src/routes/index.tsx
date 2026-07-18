import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ShoppingBag, Plus, Minus, Trash2, X, Flame, CheckCircle2, Heart, Search } from "lucide-react";
import { CartProvider, useCart } from "../lib/cart";
import { CATEGORIES, fetchProducts, formatImageUrl, type Product } from "../lib/products";
import { createOrder, debugEnv } from "../lib/orders.functions";
import logoAsset from "../assets/lovevape-logo.jpg.asset.json";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LoveVape — вейпы, жижи и расходники в Гродно" },
      { name: "description", content: "Одноразки, POD-системы и жидкости. Встреча по Гродно, оплата на месте." },
    ],
  }),
  component: () => (
    <CartProvider>
      <Shop />
      <Toaster position="top-center" theme="dark" richColors />
    </CartProvider>
  ),
});

export function Shop() {
  const [category, setCategory] = useState<string>("all");
  const [brand, setBrand] = useState<string>("all");
  const [flavor, setFlavor] = useState<string>("all");
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    debugEnv().then(keys => console.log("[DEBUG ENV KEYS STRING]:", JSON.stringify(keys))).catch(err => console.error("[DEBUG ENV FAILED]:", err));
    let cancelled = false;
    fetchProducts()
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch((err) => {
        console.error("[shop] load products failed", err);
        if (!cancelled) toast.error("Не удалось загрузить каталог");
      })
      .finally(() => {
        if (!cancelled) setLoadingProducts(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const hasSubfilters =
    category === "liquid" ||
    category === "consumable" ||
    category === "device" ||
    category === "disposable" ||
    category === "snus";

  const inCategory = useMemo(
    () => (category === "all" ? products : products.filter((p) => p.category === category)),
    [category, products]
  );

  const brandOptions = useMemo(() => {
    if (!hasSubfilters) return [] as string[];
    return Array.from(new Set(inCategory.map((p) => p.brand))).sort();
  }, [inCategory, hasSubfilters]);

  const flavorOptions = useMemo(() => {
    if (!hasSubfilters) return [] as string[];
    const set = new Set<string>();
    const productsForBrand = brand === "all" ? inCategory : inCategory.filter((p) => p.brand === brand);
    for (const p of productsForBrand) if (p.flavor) set.add(p.flavor);
    return Array.from(set).sort();
  }, [inCategory, hasSubfilters, brand]);

  const dynamicCategories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(products.map((p) => p.category)));
    const CATEGORY_MAP: Record<string, { label: string; emoji: string }> = {
      disposable: { label: "Одноразки", emoji: "💨" },
      device: { label: "Устройства", emoji: "⚡" },
      liquid: { label: "Жидкости", emoji: "🧪" },
      consumable: { label: "Расходники", emoji: "🧩" },
      snus: { label: "Снюс", emoji: "🍃" },
    };
    const list = uniqueCategories.map((id) => {
      const mapped = CATEGORY_MAP[id];
      if (mapped) {
        return { id, label: mapped.label, emoji: mapped.emoji };
      }
      const label = id.charAt(0).toUpperCase() + id.slice(1);
      return { id, label, emoji: "📦" };
    });
    return [{ id: "all", label: "Всё", emoji: "🔥" }, ...list];
  }, [products]);

  function selectCategory(id: string) {
    setCategory(id);
    setBrand("all");
    setFlavor("all");
  }

  const filtered = useMemo(() => {
    let list = inCategory;
    if (hasSubfilters) {
      if (brand !== "all") list = list.filter((p) => p.brand === brand);
      if (flavor !== "all") list = list.filter((p) => p.flavor === flavor);
    }
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p) => {
      const hay = [p.name, p.brand, p.flavor, p.puffs, p.volume].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [inCategory, hasSubfilters, brand, flavor, query]);


  return (
    <div className="min-h-screen bg-background text-foreground pb-32">


      <Header onOpenCart={() => setCartOpen(true)} />
      <Hero total={products.length} />

      {/* search */}
      <div className="px-4 mt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" strokeWidth={2.5} />
          <input
            type="search"
            inputMode="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск товара…"
            className="w-full h-11 pl-10 pr-10 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
            aria-label="Поиск товара"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-muted grid place-items-center text-muted-foreground hover:text-foreground"
              aria-label="Очистить"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* categories */}
      <div className="px-4 mt-2">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
          {dynamicCategories.map((c) => (
            <button
              key={c.id}
              onClick={() => selectCategory(c.id)}
              className={`snap-start shrink-0 px-4 py-2 rounded-full border-2 text-sm font-bold uppercase tracking-wider transition-all ${
                category === c.id
                  ? "bg-primary text-primary-foreground border-primary glow-pink"
                  : "bg-card text-foreground border-border hover:border-primary/60"
              }`}
            >
              <span className="mr-1">{c.emoji}</span>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* sub-filters for liquid / consumable */}
      {hasSubfilters && (
        <div className="px-4 mt-2 space-y-2">
          {brandOptions.length > 0 && (
            <SubFilterRow
              label="Производитель"
              options={brandOptions}
              value={brand}
              onChange={setBrand}
            />
          )}
          {flavorOptions.length > 0 && (
            <SubFilterRow
              label={category === "liquid" || category === "disposable" ? "Вкус" : "Тип"}
              options={flavorOptions}
              value={flavor}
              onChange={setFlavor}
            />
          )}
        </div>
      )}


      {/* products grid */}
      {loadingProducts ? (
        <div className="px-4 mt-8 text-center text-sm text-muted-foreground">
          Загружаем каталог…
        </div>
      ) : filtered.length === 0 ? (
        <div className="px-4 mt-8 text-center">
          <p className="text-sm text-muted-foreground">Ничего не найдено по запросу «{query}»</p>
          <button
            onClick={() => { setQuery(""); setCategory("all"); }}
            className="mt-4 inline-flex items-center gap-2 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs px-5 py-2.5 rounded-full glow-soft"
          >
            Сбросить поиск
          </button>
        </div>
      ) : (
        <section className="px-4 mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </section>
      )}

      <Footer />

      <FloatingCartBar onOpen={() => setCartOpen(true)} />

      {cartOpen && (
        <CartDrawer
          onClose={() => setCartOpen(false)}
          onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }}
        />
      )}
      {checkoutOpen && <CheckoutSheet onClose={() => setCheckoutOpen(false)} />}
    </div>
  );
}

function SubFilterRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">{label}</div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 snap-x">
        <button
          onClick={() => onChange("all")}
          className={`snap-start shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            value === "all"
              ? "bg-secondary text-secondary-foreground border-secondary"
              : "bg-card text-muted-foreground border-border hover:border-secondary/60"
          }`}
        >
          Все
        </button>
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`snap-start shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              value === opt
                ? "bg-secondary text-secondary-foreground border-secondary"
                : "bg-card text-muted-foreground border-border hover:border-secondary/60"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}




function Header({ onOpenCart }: { onOpenCart: () => void }) {
  const { count } = useCart();
  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-lg border-b border-border">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/30 overflow-hidden grid place-items-center">
            <img src={formatImageUrl(logoAsset.url) || ""} alt="LoveVape Logo" className="w-full h-full object-cover" />
          </div>
          <div className="leading-none">
            <div className="font-display text-2xl tracking-tight">
              <span className="text-primary">Love</span>
              <span className="text-foreground">Vape</span>
            </div>
          </div>
        </div>
        <button
          onClick={onOpenCart}
          className="relative w-11 h-11 rounded-xl bg-primary text-primary-foreground grid place-items-center glow-soft active:translate-y-0.5"
          aria-label="Корзина"
        >
          <ShoppingBag className="w-5 h-5" strokeWidth={2.5} />
          {count > 0 && (
            <span className="absolute -top-2 -right-2 min-w-6 h-6 px-1 rounded-full bg-secondary text-secondary-foreground text-xs font-black grid place-items-center border-2 border-background">
              {count}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}

function Hero({ total }: { total: number }) {
  return (
    <section className="px-4 pt-4">
      <div
        className="relative overflow-hidden rounded-3xl p-6 pt-8 border border-primary/30"
        style={{ backgroundImage: "var(--gradient-hero)" }}
      >
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 bg-primary/15 text-primary text-[10px] font-bold uppercase tracking-[0.25em] px-3 py-1.5 rounded-full border border-primary/40 backdrop-blur">
            <Flame className="w-3 h-3" /> new drop
          </div>
          <h1 className="mt-4 font-display text-[3.25rem] leading-[0.92] text-foreground">
            LOVE THE<br/>
            <span className="text-primary text-glow-pink">VAPE.</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-[90%] leading-relaxed">
            Одноразки, POD-системы и жидкости. Встреча по Гродно, оплата на месте.
          </p>
          <a
            href="#catalog"
            className="inline-flex items-center gap-2 mt-5 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs px-6 py-3 rounded-full glow-soft active:translate-y-0.5"
          >
            <Heart className="w-4 h-4 fill-current" /> к каталогу
          </a>
        </div>
      </div>
      <div id="catalog" className="mt-6 flex items-baseline justify-between">
        <h2 className="font-display text-3xl text-foreground">
          Каталог<span className="text-primary">.</span>
        </h2>
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{total} товаров</span>
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const out = !product.in_stock;
  return (
    <div
      className={`relative rounded-2xl border border-border overflow-hidden flex flex-col transition-all ${out ? "opacity-50 grayscale" : "hover:border-primary/60 hover:-translate-y-0.5"}`}
      style={{ backgroundImage: "var(--gradient-card)" }}
    >
      {out && (
        <div className="absolute top-2 left-2 z-10 text-[10px] font-black uppercase tracking-widest bg-background/90 text-muted-foreground px-2 py-1 rounded-full border border-border">
          нет в наличии
        </div>
      )}
      <div className="aspect-square grid place-items-center text-6xl bg-primary/5 border-b border-border/60 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 50% 50%, var(--primary) 0%, transparent 60%)" }} />
        {product.image ? (
          <img src={product.image} alt={product.name} loading="lazy" className="relative w-full h-full object-contain p-4 sm:p-5" />
        ) : (
          <span className="drop-shadow-lg">{product.emoji}</span>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{product.brand}</div>
        <div className="mt-0.5 font-bold text-xs sm:text-sm leading-tight text-foreground line-clamp-2 min-h-[2rem] flex items-center">{product.name}</div>
        {product.flavor && <div className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-2 min-h-[1.5rem] flex items-center">{product.flavor}</div>}
        {product.puffs && <div className="text-[10px] text-primary mt-0.5">{product.puffs}</div>}
        {product.volume && <div className="text-[10px] text-primary mt-0.5">{product.volume}</div>}
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="font-display text-xl">{product.price} <span className="text-xs text-muted-foreground">BYN</span></div>
          <button
            onClick={() => { if (out) return; add(product); toast.success(`${product.name} в корзине`); }}
            disabled={out}
            className="w-9 h-9 rounded-lg grid place-items-center bg-primary text-primary-foreground glow-soft active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Добавить"
          >
            <Plus className="w-4 h-4" strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
}

function FloatingCartBar({ onOpen }: { onOpen: () => void }) {
  const { count, total } = useCart();
  if (count === 0) return null;
  return (
    <div className="fixed bottom-4 left-4 right-4 z-30">
      <button
        onClick={onOpen}
        className="w-full bg-primary text-primary-foreground rounded-2xl py-3.5 px-5 flex items-center justify-between font-black uppercase tracking-widest text-sm glow-pink"
      >
        <span className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" strokeWidth={3} />
          {count} шт.
        </span>
        <span>{total.toFixed(2)} BYN →</span>
      </button>
    </div>
  );
}

function CartDrawer({ onClose, onCheckout }: { onClose: () => void; onCheckout: () => void }) {
  const { items, setQty, remove, total, clear } = useCart();
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/70 backdrop-blur-sm">
      <div className="mt-auto bg-card rounded-t-3xl border-t-2 border-primary max-h-[85vh] flex flex-col">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4 border-b border-border">
          <h3 className="font-display text-2xl truncate">Твоя корзина</h3>
          <button onClick={onClose} className="w-9 h-9 rounded-lg bg-muted grid place-items-center shrink-0" aria-label="Закрыть"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 && <p className="text-center text-muted-foreground py-10">Пусто. Закинь что-нибудь 💨</p>}
          {items.map((i) => (
            <div key={i.product.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 items-center bg-background rounded-xl p-2 border border-border">
              <div className="w-12 h-12 rounded-lg bg-muted grid place-items-center text-2xl shrink-0">{i.product.emoji}</div>
              <div className="min-w-0">
                <div className="text-sm font-bold truncate">{i.product.name}</div>
                <div className="text-xs text-muted-foreground">{i.product.price} BYN</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setQty(i.product.id, i.qty - 1)} className="w-7 h-7 rounded-md bg-muted grid place-items-center" aria-label="Уменьшить количество"><Minus className="w-3 h-3" /></button>
                <span className="w-6 text-center font-bold">{i.qty}</span>
                <button onClick={() => setQty(i.product.id, i.qty + 1)} className="w-7 h-7 rounded-md bg-primary text-primary-foreground grid place-items-center" aria-label="Увеличить количество"><Plus className="w-3 h-3" strokeWidth={3} /></button>
                <button onClick={() => remove(i.product.id)} className="ml-1 w-7 h-7 rounded-md bg-destructive/20 text-destructive grid place-items-center" aria-label="Удалить из корзины"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
        </div>
        {items.length > 0 && (
          <div className="p-4 border-t border-border space-y-3">
            <div className="flex justify-between font-display text-2xl">
              <span>Итого</span>
              <span className="text-primary text-glow-pink">{total.toFixed(2)} BYN</span>
            </div>
            <button onClick={onCheckout} className="w-full bg-primary text-primary-foreground font-black uppercase tracking-widest py-3 rounded-xl glow-pink">
              Оформить заказ
            </button>
            <button onClick={clear} className="w-full text-xs text-muted-foreground underline">Очистить корзину</button>
          </div>
        )}
      </div>
    </div>
  );
}

const MEETING_TIMES = [
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "20:20",
  "21:00",
  "После 21:00 — отдам там, где буду находиться. Закажите заранее!",
  "Для заказа Яндекс Доставки",
] as const;

function CheckoutSheet({ onClose }: { onClose: () => void }) {
  const { items, total, clear } = useCart();
  const submit = useServerFn(createOrder);
  const [telegram, setTelegram] = useState("");
  const [change, setChange] = useState("");
  const [meetingTime, setMeetingTime] = useState<string>(MEETING_TIMES[0]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<null | { id: string }>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!telegram.trim()) {
      toast.error("Укажи юзернейм Telegram");
      return;
    }
    if (items.length === 0) return;
    const tg = telegram.trim().replace(/^@+/, "");
    if (tg.length < 3) {
      toast.error("Юзернейм слишком короткий");
      return;
    }
    setLoading(true);
    try {
      const noteParts = [
        `Сдача: ${change.trim() ? change.trim() : "не нужна"}`,
      ];
      const res = await submit({
        data: {
          customer_name: `@${tg}`,
          customer_phone: "Telegram",
          customer_address: meetingTime,
          customer_note: noteParts.join(" · "),
          items: items.map((i) => ({ id: i.product.id, name: i.product.name, price: i.product.price, qty: i.qty })),
          total_amount: total,
          origin: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      setDone({ id: res.id });
      clear();
    } catch (err) {
      console.error(err);
      toast.error("Не удалось отправить заказ. Попробуй ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col">
      <div className="mt-auto bg-card rounded-t-3xl border-t-2 border-secondary max-h-[92vh] flex flex-col">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4 border-b border-border">
          <h3 className="font-display text-2xl truncate">{done ? "Заказ принят" : "Оформление"}</h3>
          <button onClick={onClose} className="w-9 h-9 rounded-lg bg-muted grid place-items-center shrink-0" aria-label="Закрыть"><X className="w-5 h-5" /></button>
        </div>

        {done ? (
          <div className="p-6 text-center flex-1 overflow-y-auto">
            <CheckCircle2 className="w-16 h-16 text-primary mx-auto" strokeWidth={2.5} />
            <h4 className="font-display text-3xl mt-3 text-glow-pink text-primary">Готово!</h4>
            <p className="mt-2 text-sm text-muted-foreground">
              Номер заказа <span className="font-mono text-foreground">#{done.id.slice(0, 8)}</span>.
              Мы напишем тебе в Telegram в ближайшее время.
            </p>
            <button onClick={onClose} className="mt-6 bg-primary text-primary-foreground font-black uppercase tracking-widest px-6 py-3 rounded-xl glow-soft">
              Закрыть
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-3 overflow-y-auto">
            <Field label="Юзернейм Telegram" value={telegram} onChange={setTelegram} placeholder="@username" />
            <Field label="Нужна ли сдача?" value={change} onChange={setChange} placeholder="Например: сдача с 50" textarea />

            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Время встречи</span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {MEETING_TIMES.map((t) => {
                  const active = meetingTime === t;
                  return (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setMeetingTime(t)}
                      className={`text-left text-xs font-semibold px-3 py-2.5 rounded-xl border transition-all ${
                        active
                          ? "bg-primary text-primary-foreground border-primary glow-pink"
                          : "bg-background text-foreground border-border hover:border-primary/60"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </label>

            <div className="bg-background rounded-xl p-3 border border-border">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Заказ</div>
              {items.map((i) => (
                <div key={i.product.id} className="flex justify-between text-sm py-0.5">
                  <span className="truncate mr-2">{i.product.name} × {i.qty}</span>
                  <span className="font-bold shrink-0">{(i.product.price * i.qty).toFixed(2)}</span>
                </div>
              ))}
              <div className="mt-2 pt-2 border-t border-border flex justify-between font-display text-xl">
                <span>Итого</span>
                <span className="text-primary">{total.toFixed(2)} BYN</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-black uppercase tracking-widest py-3 rounded-xl glow-pink disabled:opacity-60"
            >
              {loading ? "Отправляем..." : "Подтвердить заказ"}
            </button>
            <p className="text-[10px] text-center text-muted-foreground">
              Нажимая кнопку, вы подтверждаете возраст 18+ и согласие на обработку данных.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text", textarea,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; textarea?: boolean;
}) {
  const base = "w-full bg-background border-2 border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none";
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={2} className={base + " mt-1 resize-none"} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={base + " mt-1"} />
      )}
    </label>
  );
}

function Footer() {
  return (
    <footer className="mt-10 px-4 pb-4">
      <div className="rounded-2xl border border-border bg-card p-5 text-center">
        <div className="font-display text-3xl tracking-tight">
          <span className="text-primary">Love</span>
          <span className="text-foreground">Vape</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Встреча по городу · Оплата на месте</p>
      </div>
    </footer>
  );
}


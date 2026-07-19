import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Check, X as XIcon, Search } from "lucide-react";
import { toast, Toaster } from "sonner";
import {
  adminListProducts,
  adminUpsertProduct,
  adminDeleteProduct,
  adminToggleStock,
} from "@/lib/admin.functions";

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: "device" | "disposable" | "liquid" | "consumable" | string;
  price: number | string;
  flavor: string | null;
  puffs: string | null;
  volume: string | null;
  emoji: string;
  color: string;
  image_url: string | null;
  in_stock: boolean;
  sort_order: number;
};

type Draft = {
  id?: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  price: string;
  flavor: string;
  puffs: string;
  volume: string;
  emoji: string;
  color: "pink" | "cyan" | "lime";
  image_url: string;
  in_stock: boolean;
  sort_order: string;
};

const EMPTY: Draft = {
  slug: "",
  name: "",
  brand: "",
  category: "disposable",
  price: "0",
  flavor: "",
  puffs: "",
  volume: "",
  emoji: "🔥",
  color: "pink",
  image_url: "",
  in_stock: true,
  sort_order: "0",
};

export const Route = createFileRoute("/_authenticated/admin/")({
  component: ProductsAdmin,
});

const CATEGORY_MAP: Record<string, string> = {
  disposable: "Одноразки",
  device: "Устройства",
  liquid: "Жидкости",
  consumable: "Расходники",
  snus: "Снюс",
};

function getCategoryLabel(id: string): string {
  return CATEGORY_MAP[id] || (id.charAt(0).toUpperCase() + id.slice(1));
}

function ProductsAdmin() {
  const list = useServerFn(adminListProducts);
  const upsert = useServerFn(adminUpsertProduct);
  const remove = useServerFn(adminDeleteProduct);
  const toggle = useServerFn(adminToggleStock);

  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [brand, setBrand] = useState<string>("all");
  const [flavor, setFlavor] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);

  const dynamicCategories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(rows.map((r) => r.category)));
    const list = uniqueCategories.map((id) => ({
      id,
      label: getCategoryLabel(id),
    }));
    return [{ id: "all", label: "Все" }, ...list];
  }, [rows]);

  const formCategories = useMemo(() => {
    const defaults = [
      { id: "disposable", label: "Одноразка" },
      { id: "device", label: "Устройство" },
      { id: "liquid", label: "Жидкость" },
      { id: "consumable", label: "Расходник" },
      { id: "snus", label: "Снюс" },
    ];
    const unique = Array.from(new Set(rows.map((r) => r.category)));
    const list = [...defaults];
    for (const id of unique) {
      if (!list.some(item => item.id === id)) {
        const label = id.charAt(0).toUpperCase() + id.slice(1);
        list.push({ id, label });
      }
    }
    return list;
  }, [rows]);

  async function reload(silent = false) {
    if (!silent) setLoading(true);
    try {
      const data = (await list()) as unknown as ProductRow[];
      setRows(data);
    } catch (e: any) {
      toast.error(e?.message ?? "Ошибка загрузки");
    } finally {
      if (!silent) setLoading(false);
    }
  }
  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inCategory = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.category === filter)),
    [rows, filter],
  );
  const hasSub = filter !== "all";
  const brandOptions = useMemo(() => {
    if (!hasSub) return [] as string[];
    return Array.from(new Set(inCategory.map((r) => r.brand))).sort();
  }, [inCategory, hasSub]);
  const flavorOptions = useMemo(() => {
    if (!hasSub) return [] as string[];
    const set = new Set<string>();
    const rowsForBrand = brand === "all" ? inCategory : inCategory.filter((r) => r.brand === brand);
    for (const r of rowsForBrand) if (r.flavor) set.add(r.flavor);
    return Array.from(set).sort();
  }, [inCategory, hasSub, brand]);
  const visible = useMemo(() => {
    let list = inCategory;
    if (hasSub) {
      if (brand !== "all") list = list.filter((r) => r.brand === brand);
      if (flavor !== "all") list = list.filter((r) => r.flavor === flavor);
    }
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) => {
      const hay = [r.name, r.brand, r.flavor, r.puffs, r.volume].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [inCategory, hasSub, brand, flavor, query]);
  function selectCategory(id: string) {
    setFilter(id);
    setBrand("all");
    setFlavor("all");
  }

  function edit(row: ProductRow) {
    setShowCustomCategoryInput(false);
    setDraft({
      id: row.id,
      slug: row.slug,
      name: row.name,
      brand: row.brand,
      category: row.category ?? "disposable",
      price: String(row.price),
      flavor: row.flavor ?? "",
      puffs: row.puffs ?? "",
      volume: row.volume ?? "",
      emoji: row.emoji || "🔥",
      color: (row.color as Draft["color"]) ?? "pink",
      image_url: row.image_url ?? "",
      in_stock: row.in_stock,
      sort_order: String(row.sort_order),
    });
  }

  async function save() {
    if (!draft) return;
    const isEdit = !!draft.id;
    const savedProduct: ProductRow = {
      id: draft.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)),
      slug: draft.slug.trim(),
      name: draft.name.trim(),
      brand: draft.brand.trim(),
      category: draft.category,
      price: Number(draft.price) || 0,
      flavor: draft.flavor || null,
      puffs: draft.puffs || null,
      volume: draft.volume || null,
      emoji: draft.emoji.trim() || "🔥",
      color: draft.color,
      image_url: draft.image_url || null,
      in_stock: draft.in_stock,
      sort_order: Number(draft.sort_order) || 0,
    };

    // Optimistically update local state instantly
    if (isEdit) {
      setRows((prev) => prev.map((r) => (r.id === draft.id ? savedProduct : r)));
    } else {
      setRows((prev) => [...prev, savedProduct].sort((a, b) => a.sort_order - b.sort_order));
    }

    // Automatically switch filter to the product's new category so the user can see it!
    setFilter(draft.category);
    setBrand("all");
    setFlavor("all");

    setDraft(null);

    try {
      await upsert({
        data: {
          id: draft.id,
          slug: draft.slug.trim(),
          name: draft.name.trim(),
          brand: draft.brand.trim(),
          category: draft.category,
          price: Number(draft.price) || 0,
          flavor: draft.flavor,
          puffs: draft.puffs,
          volume: draft.volume,
          emoji: draft.emoji.trim() || "🔥",
          color: draft.color,
          image_url: draft.image_url,
          in_stock: draft.in_stock,
          sort_order: Number(draft.sort_order) || 0,
        },
      });
      toast.success(isEdit ? "Сохранено" : "Товар добавлен");
      await reload(true);
    } catch (e: any) {
      toast.error(e?.message ?? "Не удалось сохранить");
      await reload();
    }
  }

  async function del(row: ProductRow) {
    if (!confirm(`Удалить «${row.name}»?`)) return;

    // Optimistically remove from local state instantly
    setRows((prev) => prev.filter((r) => r.id !== row.id));

    try {
      await remove({ data: { id: row.id } });
      toast.success("Удалено");
      await reload(true);
    } catch (e: any) {
      toast.error(e?.message ?? "Не удалось удалить");
      await reload();
    }
  }

  async function flipStock(row: ProductRow) {
    const nextInStock = !row.in_stock;

    // Optimistically update local state instantly
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, in_stock: nextInStock } : r)));

    try {
      await toggle({ data: { id: row.id, in_stock: nextInStock } });
    } catch (e: any) {
      toast.error(e?.message ?? "Ошибка");
      // Rollback on error
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, in_stock: row.in_stock } : r)));
    }
  }

  return (
    <div className="space-y-4">
      <Toaster position="top-center" theme="dark" richColors />
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl">Товары</h1>
        <button
          onClick={() => {
            setShowCustomCategoryInput(false);
            setDraft(EMPTY);
          }}
          className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground font-bold px-3 py-1.5 rounded-lg text-sm"
        >
          <Plus className="w-4 h-4" /> Добавить
        </button>
      </div>

      {/* search */}
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
            <XIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex gap-1.5 overflow-x-auto">
        {dynamicCategories.map((c) => (
          <button
            key={c.id}
            onClick={() => selectCategory(c.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${filter === c.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {hasSub && (brandOptions.length > 0 || flavorOptions.length > 0) && (
        <div className="space-y-2">
          {brandOptions.length > 0 && (
            <SubRow label="Производитель" options={brandOptions} value={brand} onChange={setBrand} />
          )}
          {flavorOptions.length > 0 && (
            <SubRow
              label={filter === "liquid" || filter === "disposable" ? "Вкус" : "Тип"}
              options={flavorOptions}
              value={flavor}
              onChange={setFlavor}
            />
          )}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      ) : (
        <div className="grid gap-2">
          {visible.map((row) => (
            <div key={row.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-muted grid place-items-center text-2xl shrink-0 overflow-hidden">
                {row.image_url ? (
                  <img src={row.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span>{row.emoji}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{row.brand} · {row.category}</div>
                <div className="font-bold text-sm leading-snug break-words">{row.name}</div>
                <div className="text-xs text-muted-foreground break-words">
                  {row.flavor || row.volume || row.puffs || "—"}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-display text-lg">{Number(row.price).toFixed(2)}</div>
                <div className="text-[10px] text-muted-foreground">BYN</div>
              </div>
              <button
                onClick={() => flipStock(row)}
                title={row.in_stock ? "В наличии" : "Нет в наличии"}
                className={`w-9 h-9 rounded-lg grid place-items-center ${row.in_stock ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {row.in_stock ? <Check className="w-4 h-4" /> : <XIcon className="w-4 h-4" />}
              </button>
              <button
                onClick={() => edit(row)}
                className="w-9 h-9 rounded-lg grid place-items-center bg-muted"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => del(row)}
                className="w-9 h-9 rounded-lg grid place-items-center bg-destructive/20 text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {draft && (
        <DraftEditor
          draft={draft}
          onChange={setDraft}
          onCancel={() => setDraft(null)}
          onSave={save}
          rows={rows}
        />
      )}
    </div>
  );
}

function DraftEditor({
  draft,
  onChange,
  onCancel,
  onSave,
  rows,
}: {
  draft: Draft;
  onChange: (d: Draft) => void;
  onCancel: () => void;
  onSave: () => void;
  rows: ProductRow[];
}) {
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => onChange({ ...draft, [k]: v });

  const formCategories = useMemo(() => {
    const defaults = [
      { id: "disposable", label: "Одноразка" },
      { id: "device", label: "Устройство" },
      { id: "liquid", label: "Жидкость" },
      { id: "consumable", label: "Расходник" },
    ];
    const unique = Array.from(new Set(rows.map((r) => r.category)));
    const list = [...defaults];
    for (const id of unique) {
      if (!list.some(item => item.id === id)) {
        const label = id.charAt(0).toUpperCase() + id.slice(1);
        list.push({ id, label });
      }
    }
    return list;
  }, [rows]);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl p-4 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-display text-xl">{draft.id ? "Редактировать" : "Новый товар"}</h3>
          <button onClick={onCancel} className="w-8 h-8 rounded-lg bg-muted grid place-items-center">
            <XIcon className="w-4 h-4" />
          </button>
        </div>
        <F label="Slug (уникальный)" v={draft.slug} on={(v) => set("slug", v)} />
        <F label="Название" v={draft.name} on={(v) => set("name", v)} />
        <F label="Бренд" v={draft.brand} on={(v) => set("brand", v)} />
        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Категория</span>
          <select
            value={showCustomCategoryInput ? "+custom" : draft.category}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "+custom") {
                setShowCustomCategoryInput(true);
                set("category", "");
              } else {
                setShowCustomCategoryInput(false);
                set("category", val);
              }
            }}
            className="mt-1 w-full bg-background border-2 border-border rounded-xl px-3 py-2.5 text-sm"
          >
            {formCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
            <option value="+custom">+ Добавить новую...</option>
          </select>
        </label>
        {showCustomCategoryInput && (
          <div className="mt-2">
            <F
              label="Название новой категории (на английском, например: pod)"
              v={draft.category}
              on={(v) => set("category", v.toLowerCase().trim())}
            />
          </div>
        )}
        <F label="Цена (BYN)" v={draft.price} on={(v) => set("price", v)} type="number" />
        <F label="Вкус / вариант" v={draft.flavor} on={(v) => set("flavor", v)} />
        <F label="Затяжки" v={draft.puffs} on={(v) => set("puffs", v)} />
        <F label="Объём / характеристики" v={draft.volume} on={(v) => set("volume", v)} />
        <F label="Эмодзи (если нет фото)" v={draft.emoji} on={(v) => set("emoji", v)} />
        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Цвет акцента</span>
          <select
            value={draft.color}
            onChange={(e) => set("color", e.target.value as Draft["color"])}
            className="mt-1 w-full bg-background border-2 border-border rounded-xl px-3 py-2.5 text-sm"
          >
            <option value="pink">pink</option>
            <option value="cyan">cyan</option>
            <option value="lime">lime</option>
          </select>
        </label>
        <F label="URL картинки (опционально)" v={draft.image_url} on={(v) => set("image_url", v)} />
        <F label="Порядок сортировки" v={draft.sort_order} on={(v) => set("sort_order", v)} type="number" />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.in_stock}
            onChange={(e) => set("in_stock", e.target.checked)}
          />
          <span>В наличии</span>
        </label>
        <div className="flex gap-2 pt-2">
          <button onClick={onSave} className="flex-1 bg-primary text-primary-foreground font-bold py-2.5 rounded-lg">
            Сохранить
          </button>
          <button onClick={onCancel} className="px-4 py-2.5 rounded-lg bg-muted font-semibold">
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

function F({
  label,
  v,
  on,
  type = "text",
}: {
  label: string;
  v: string;
  on: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      <input
        type={type}
        value={v}
        onChange={(e) => on(e.target.value)}
        className="mt-1 w-full bg-background border-2 border-border rounded-xl px-3 py-2.5 text-sm"
      />
    </label>
  );
}

function SubRow({
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
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => onChange("all")}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${value === "all" ? "bg-secondary text-secondary-foreground border-secondary" : "bg-card text-muted-foreground border-border"}`}
        >
          Все
        </button>
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${value === opt ? "bg-secondary text-secondary-foreground border-secondary" : "bg-card text-muted-foreground border-border"}`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}


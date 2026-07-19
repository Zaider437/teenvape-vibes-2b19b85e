import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "./products";

export type CartItem = { product: Product; qty: number };

type CartCtx = {
  items: CartItem[];
  add: (p: Product) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  count: number;
  total: number;
};

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("vh_cart") : null;
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      localStorage.setItem("vh_cart", JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const value = useMemo<CartCtx>(() => ({
    items,
    add: (p) =>
      setItems((prev) => {
        const ex = prev.find((i) => i.product.id === p.id);
        if (ex) return prev.map((i) => (i.product.id === p.id ? { ...i, qty: i.qty + 1 } : i));
        return [...prev, { product: p, qty: 1 }];
      }),
    remove: (id) => setItems((prev) => prev.filter((i) => i.product.id !== id)),
    setQty: (id, qty) =>
      setItems((prev) =>
        qty <= 0 ? prev.filter((i) => i.product.id !== id) : prev.map((i) => (i.product.id === id ? { ...i, qty } : i)),
      ),
    clear: () => setItems([]),
    count: items.reduce((s, i) => s + i.qty, 0),
    total: items.reduce((s, i) => s + i.qty * i.product.price, 0),
  }), [items]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart outside provider");
  return c;
}
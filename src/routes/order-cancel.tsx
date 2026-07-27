import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { cancelOrder, getOrderByToken } from "@/lib/orders.functions";
import { Link } from "@tanstack/react-router";
import { toast, Toaster } from "sonner";
import { ShoppingBag, X, AlertCircle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/order-cancel")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: (search.token as string) || "",
    };
  },
  head: () => ({
    meta: [
      { title: "Отмена заказа — LoveVape" },
      { name: "description", content: "Отменить ранее оформленный заказ в LoveVape." },
      { property: "og:title", content: "Отмена заказа — LoveVape" },
      { property: "og:description", content: "Отменить ранее оформленный заказ в LoveVape." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OrderCancelPage,
});

export function OrderCancelPage() {
  const { token } = useSearch({ from: "/order-cancel" });
  const fetchOrder = useServerFn(getOrderByToken);
  const doCancel = useServerFn(cancelOrder);

  const [order, setOrder] = useState<{
    id: string;
    customer_name: string;
    customer_address: string;
    customer_note: string | null;
    items: Array<{ name: string; brand: string; qty: number; price: number; flavor?: string | null; image?: string | null }>;
    total_amount: number;
    status: string;
    created_at: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("В ссылке отсутствует токен отмены.");
      setLoading(false);
      return;
    }
    async function loadOrder() {
      try {
        const orderData = await fetchOrder({ data: { token } });
        if (orderData && orderData.id) {
          setOrder(orderData);
        } else {
          setError("Заказ не найден.");
        }
      } catch {
        setError("Неверный формат ссылки отмены.");
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [token, fetchOrder]);

  async function handleCancel() {
    if (!token) return;
    setCancelling(true);
    try {
      const result = await doCancel({ data: { token } });
      setDone(true);
      if (!result.alreadyCancelled && order) {
        setOrder({ ...order, status: "cancelled" });
      }
      toast.success(result.alreadyCancelled ? "Заказ уже был отменён ранее." : "Заказ отменён.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось отменить заказ.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-8">
      <Toaster position="top-center" theme="dark" richColors />
      <div className="max-w-md mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
        >
          <ShoppingBag className="w-4 h-4" /> ← В каталог
        </Link>

        <h1 className="mt-6 font-display text-3xl">
          Отмена <span className="text-primary">заказа</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Если ты передумал или ошибся с выбором — отмени заказ здесь.
        </p>

        {loading && (
          <div className="mt-8 p-6 rounded-2xl border border-border bg-card animate-pulse">
            <div className="h-5 bg-muted rounded w-2/3 mb-4" />
            <div className="h-4 bg-muted rounded w-1/2 mb-2" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        )}

        {!loading && error && (
          <div className="mt-8 p-5 rounded-2xl border border-destructive/40 bg-destructive/10 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">{error}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Возможно, ссылка устарела или заказ уже обработан.
              </p>
            </div>
          </div>
        )}

        {!loading && !error && order && (
          <div className="mt-8 space-y-4">
            <div className="p-5 rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Заказ #{order.id.slice(0, 8)}
                </span>
                <span
                  className={`text-xs font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                    order.status === "cancelled"
                      ? "bg-destructive/20 text-destructive"
                      : "bg-primary/15 text-primary"
                  }`}
                >
                  {order.status === "cancelled" ? "отменён" : "новый"}
                </span>
              </div>
              <div className="mt-3 text-sm">
                <p className="text-muted-foreground">Время встречи:</p>
                <p className="font-semibold">{order.customer_address}</p>
              </div>
              {order.customer_note && (
                <div className="mt-2 text-sm">
                  <p className="text-muted-foreground">Комментарий:</p>
                  <p className="font-semibold">{order.customer_note}</p>
                </div>
              )}
              <div className="mt-4 space-y-1">
                {order.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {i.name} ({i.brand}){i.flavor ? `, ${i.flavor}` : ""} × {i.qty}
                    </span>
                    <span className="font-semibold">{(i.price * i.qty).toFixed(2)} BYN</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
                <span className="font-bold uppercase tracking-widest text-sm">Итого</span>
                <span className="font-display text-xl text-primary">
                  {order.total_amount.toFixed(2)} BYN
                </span>
              </div>
            </div>

            {done || order.status === "cancelled" ? (
              <div className="p-5 rounded-2xl border border-primary/40 bg-primary/10 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">Заказ отменён</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Если передумаешь — оформи новый заказ в каталоге.
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="w-full py-3.5 rounded-xl bg-destructive text-destructive-foreground font-black uppercase tracking-widest text-sm transition-all hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {cancelling ? (
                  <>
                    <span className="w-4 h-4 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin" />
                    Отменяем...
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4" /> Отменить заказ
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

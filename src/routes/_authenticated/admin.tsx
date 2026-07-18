import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Package, Users, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login", replace: true });
  }
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="font-display text-xl">
            <span className="text-primary">Love</span>Vape
            <span className="ml-2 text-xs uppercase tracking-widest text-muted-foreground">admin</span>
          </div>
          <nav className="flex items-center gap-1">
            <Link
              to="/admin"
              activeOptions={{ exact: true }}
              activeProps={{ className: "bg-primary text-primary-foreground" }}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5"
            >
              <Package className="w-4 h-4" /> Товары
            </Link>
            <Link
              to="/admin/users"
              activeProps={{ className: "bg-primary text-primary-foreground" }}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5"
            >
              <Users className="w-4 h-4" /> Доступы
            </Link>
            <Link
              to="/admin/settings"
              activeProps={{ className: "bg-primary text-primary-foreground" }}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5"
            >
              <Clock className="w-4 h-4" /> Время встречи
            </Link>
            <button
              onClick={signOut}
              className="ml-2 px-3 py-1.5 rounded-lg text-sm font-semibold bg-muted hover:bg-muted/70 flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" /> Выйти
            </button>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
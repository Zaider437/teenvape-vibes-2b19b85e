import { useState } from "react";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Package, Users, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  async function signOut() {
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsSigningOut(false);
      navigate({ to: "/admin/login", replace: true });
    }
  }
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="font-display text-xl">
              <span className="text-primary">Love</span>Vape
              <span className="ml-2 text-xs uppercase tracking-widest text-muted-foreground">admin</span>
            </div>
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="sm:hidden px-3 py-2 rounded-lg bg-muted font-semibold text-sm min-h-[44px]"
            >
              {mobileNavOpen ? "Закрыть" : "Меню"}
            </button>
          </div>
          <nav
            className={`${mobileNavOpen ? "flex" : "hidden"} sm:flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-1 mt-3 sm:mt-0 overflow-x-auto`}
          >
            <Link
              to="/admin"
              activeOptions={{ exact: true }}
              activeProps={{ className: "bg-primary text-primary-foreground" }}
              onClick={() => setMobileNavOpen(false)}
              className="px-3 py-2 sm:py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap min-h-[44px] sm:min-h-0 w-full sm:w-auto"
            >
              <Package className="w-4 h-4" /> Товары
            </Link>
            <Link
              to="/admin/users"
              activeProps={{ className: "bg-primary text-primary-foreground" }}
              onClick={() => setMobileNavOpen(false)}
              className="px-3 py-2 sm:py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap min-h-[44px] sm:min-h-0 w-full sm:w-auto"
            >
              <Users className="w-4 h-4" /> Доступы
            </Link>
            <Link
              to="/admin/settings"
              activeProps={{ className: "bg-primary text-primary-foreground" }}
              onClick={() => setMobileNavOpen(false)}
              className="px-3 py-2 sm:py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap min-h-[44px] sm:min-h-0 w-full sm:w-auto"
            >
              <Clock className="w-4 h-4" /> Время встречи
            </Link>
            <button
              onClick={() => { setMobileNavOpen(false); signOut(); }}
              disabled={isSigningOut}
              className="ml-0 sm:ml-2 px-3 py-2 sm:py-1.5 rounded-lg text-sm font-semibold bg-muted hover:bg-muted/70 flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap min-h-[44px] sm:min-h-0 w-full sm:w-auto"
            >
              <LogOut className="w-4 h-4" /> {isSigningOut ? "Выход..." : "Выйти"}
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
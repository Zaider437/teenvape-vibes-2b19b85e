import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast, Toaster } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  getTelegramLoginConfig,
  telegramLogin,
  type TelegramAuthData,
} from "@/lib/telegram-auth.functions";
import { z } from "zod";

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramAuthData) => void;
  }
}

export const Route = createFileRoute("/admin/login")({
  ssr: false,
  validateSearch: z.object({
    next: z.string().optional(),
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const getConfig = useServerFn(getTelegramLoginConfig);
  const login = useServerFn(telegramLogin);
  const [botUsername, setBotUsername] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(true);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Добро пожаловать в админку");
      navigate({ to: "/admin", replace: true });
    } catch (e: any) {
      setErr(e?.message ?? "Неверный email или пароль");
      toast.error(e?.message ?? "Неверный email или пароль");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    // If already signed in — go straight to /admin.
    try {
      const hasSession =
        typeof window !== "undefined" &&
        Object.keys(localStorage).some((k) => k.startsWith("sb-") && k.endsWith("-auth-token"));
      if (hasSession) {
        supabase.auth
          .getUser()
          .then(({ data }) => {
            if (data?.user) navigate({ to: "/admin", replace: true });
          })
          .catch((err) => {
            console.warn("[admin-login] Supabase auth check failed:", err);
          });
      }
    } catch (err) {
      console.warn("[admin-login] Supabase auth check crashed:", err);
    }

    getConfig()
      .then((cfg) => setBotUsername(cfg.botUsername))
      .catch(() => {});
  }, [navigate]);

  useEffect(() => {
    if (showPasswordForm || !botUsername || !containerRef.current) return;

    window.onTelegramAuth = async (user) => {
      setBusy(true);
      setErr(null);
      try {
        const { email, password } = await login({ data: user });
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Добро пожаловать в админку");
        navigate({ to: "/admin", replace: true });
      } catch (e: any) {
        setErr(e?.message ?? "Ошибка входа");
        toast.error(e?.message ?? "Ошибка входа");
      } finally {
        setBusy(false);
      }
    };

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-userpic", "true");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");

    const container = containerRef.current;
    container.appendChild(script);

    return () => {
      if (container) {
        container.innerHTML = "";
      }
      script.remove();
      delete window.onTelegramAuth;
    };
  }, [botUsername, login, navigate, showPasswordForm]);

  return (
    <div className="min-h-screen bg-background text-foreground grid place-items-center p-6">
      <Toaster position="top-center" theme="dark" richColors />
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 text-center space-y-4">
        <div className="font-display text-3xl">
          <span className="text-primary">Love</span>Vape
        </div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          Админка каталога
        </div>
        <p className="text-sm text-muted-foreground">
          Войдите через Telegram. Пускаем только тех, чей @username добавлен в белый список.
        </p>
        {showPasswordForm ? (
          <form onSubmit={handlePasswordLogin} className="space-y-3 text-left">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@lovevape.by"
                className="w-full bg-background border-2 border-border rounded-xl px-3 py-2 mt-1 text-sm text-foreground focus:border-primary focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-background border-2 border-border rounded-xl px-3 py-2 mt-1 text-sm text-foreground focus:border-primary focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-primary text-primary-foreground font-black uppercase tracking-widest py-2.5 rounded-xl glow-pink disabled:opacity-60 mt-2"
            >
              {busy ? "Вход..." : "Войти"}
            </button>
            <button
              type="button"
              onClick={() => setShowPasswordForm(false)}
              className="w-full py-2.5 px-4 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-all mt-3"
            >
              Войти через Telegram
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            {!botUsername ? (
              <p className="text-xs text-muted-foreground">Загружаем виджет…</p>
            ) : (
              <div ref={containerRef} className="flex justify-center min-h-[44px]" />
            )}
            <button
              type="button"
              onClick={() => setShowPasswordForm(true)}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground mt-2"
            >
              Назад к входу по паролю
            </button>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground">
          Если кнопка не появляется — убедитесь, что домен добавлен у @BotFather (/setdomain для{" "}
          {botUsername || "бота"}).
        </p>
      </div>
    </div>
  );
}

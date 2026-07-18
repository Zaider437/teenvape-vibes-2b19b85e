import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast, Toaster } from "sonner";
import {
  adminListTelegramUsers,
  adminAddTelegramUser,
  adminRemoveTelegramUser,
} from "@/lib/admin.functions";

type Row = {
  id: string;
  telegram_username: string;
  telegram_id: number | null;
  note: string | null;
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: WhitelistAdmin,
});

function WhitelistAdmin() {
  const list = useServerFn(adminListTelegramUsers);
  const add = useServerFn(adminAddTelegramUser);
  const remove = useServerFn(adminRemoveTelegramUser);

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [note, setNote] = useState("");

  async function reload() {
    setLoading(true);
    try {
      const data = (await list()) as unknown as Row[];
      setRows(data);
    } catch (e: any) {
      toast.error(e?.message ?? "Ошибка");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;
    try {
      await add({ data: { telegram_username: username, note: note || null } });
      setUsername("");
      setNote("");
      toast.success("Добавлено");
      await reload();
    } catch (e: any) {
      toast.error(e?.message ?? "Не удалось добавить");
    }
  }

  async function del(row: Row) {
    if (!confirm(`Удалить @${row.telegram_username} из белого списка?`)) return;
    try {
      await remove({ data: { id: row.id } });
      toast.success("Удалено");
      await reload();
    } catch (e: any) {
      toast.error(e?.message ?? "Не удалось удалить");
    }
  }

  return (
    <div className="space-y-4">
      <Toaster position="top-center" theme="dark" richColors />
      <h1 className="font-display text-2xl">Доступы</h1>
      <p className="text-sm text-muted-foreground">
        Здесь список Telegram-аккаунтов, которые могут войти в админку. Добавляйте по @username (без @).
      </p>

      <form onSubmit={submit} className="bg-card border border-border rounded-xl p-3 space-y-2">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">@username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username_в_telegram"
              className="mt-1 w-full bg-background border-2 border-border rounded-xl px-3 py-2.5 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Заметка (кто это)</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Например: помощница по каталогу"
              className="mt-1 w-full bg-background border-2 border-border rounded-xl px-3 py-2.5 text-sm"
            />
          </label>
          <button type="submit" className="h-11 px-4 bg-primary text-primary-foreground font-bold rounded-xl flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Добавить
          </button>
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      ) : (
        <div className="grid gap-2">
          {rows.map((row) => (
            <div key={row.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-bold">@{row.telegram_username}</div>
                {row.note && <div className="text-xs text-muted-foreground truncate">{row.note}</div>}
                {row.telegram_id && (
                  <div className="text-[10px] text-muted-foreground">Telegram ID: {row.telegram_id}</div>
                )}
              </div>
              <button
                onClick={() => del(row)}
                className="w-9 h-9 rounded-lg grid place-items-center bg-destructive/20 text-destructive"
                aria-label="Удалить"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Plus, Trash2, Save, ArrowUp, ArrowDown } from "lucide-react";
import { toast, Toaster } from "sonner";
import { adminGetMeetingTimes, adminUpdateMeetingTimes } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const getTimes = useServerFn(adminGetMeetingTimes);
  const updateTimes = useServerFn(adminUpdateMeetingTimes);

  const [times, setTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setCancelling] = useState(false);
  const [newTime, setNewTime] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await getTimes();
      setTimes(data);
    } catch (e: any) {
      toast.error(e?.message ?? "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave() {
    setCancelling(true);
    try {
      await updateTimes({ data: { times } });
      toast.success("Настройки сохранены");
    } catch (e: any) {
      toast.error(e?.message ?? "Не удалось сохранить");
    } finally {
      setCancelling(false);
    }
  }

  function addTime() {
    const val = newTime.trim();
    if (!val) return;
    if (times.includes(val)) {
      toast.error("Такое время уже есть");
      return;
    }
    setTimes([...times, val]);
    setNewTime("");
  }

  function removeTime(index: number) {
    setTimes(times.filter((_, i) => i !== index));
  }

  function move(index: number, direction: "up" | "down") {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= times.length) return;
    const copy = [...times];
    const temp = copy[index];
    copy[index] = copy[nextIndex];
    copy[nextIndex] = temp;
    setTimes(copy);
  }

  return (
    <div className="space-y-6 max-w-xl">
      <Toaster position="top-center" theme="dark" richColors />
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl">Настройки времени встречи</h1>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground font-bold px-4 py-2 rounded-xl text-sm glow-pink disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {saving ? "Сохраняем..." : "Сохранить"}
        </button>
      </div>

      {loading ? (
        <div className="text-center text-sm text-muted-foreground py-8">Загружаем настройки…</div>
      ) : (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Добавить новое время</div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                placeholder="Например: 19:00 или После 21:00"
                className="flex-1 bg-background border-2 border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <button
                onClick={addTime}
                className="bg-primary text-primary-foreground font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Добавить
              </button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Список доступных времён</div>
            {times.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-4">Список пуст. Добавьте время выше.</div>
            ) : (
              <div className="divide-y divide-border">
                {times.map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="text-sm font-semibold">{t}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => move(idx, "up")}
                        disabled={idx === 0}
                        className="w-8 h-8 rounded-lg bg-muted grid place-items-center disabled:opacity-30"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => move(idx, "down")}
                        disabled={idx === times.length - 1}
                        className="w-8 h-8 rounded-lg bg-muted grid place-items-center disabled:opacity-30"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeTime(idx)}
                        className="w-8 h-8 rounded-lg bg-destructive/20 text-destructive grid place-items-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

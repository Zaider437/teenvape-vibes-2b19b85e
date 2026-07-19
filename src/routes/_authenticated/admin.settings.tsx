import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Plus, Trash2, Save, ArrowUp, ArrowDown } from "lucide-react";
import { toast, Toaster } from "sonner";
import { adminGetMeetingTimes, adminUpdateMeetingTimes, getAnimationSettings, adminUpdateAnimationSettings } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const getTimes = useServerFn(adminGetMeetingTimes);
  const updateTimes = useServerFn(adminUpdateMeetingTimes);
  const getAnim = useServerFn(getAnimationSettings);
  const updateAnim = useServerFn(adminUpdateAnimationSettings);

  const [times, setTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setCancelling] = useState(false);
  const [newTime, setNewTime] = useState("");

  // Animation settings states
  const [leavesEnabled, setLeavesEnabled] = useState(true);
  const [leavesFrom, setLeavesFrom] = useState(9);
  const [leavesTo, setLeavesTo] = useState(11);

  const [snowEnabled, setSnowEnabled] = useState(true);
  const [snowFrom, setSnowFrom] = useState(12);
  const [snowTo, setSnowTo] = useState(2);

  async function load() {
    setLoading(true);
    try {
      const [timesData, animData] = await Promise.all([
        getTimes(),
        getAnim()
      ]);
      setTimes(timesData);

      if (animData) {
        setLeavesEnabled(animData.leaves.enabled);
        setLeavesFrom(animData.leaves.from);
        setLeavesTo(animData.leaves.to);
        setSnowEnabled(animData.snow.enabled);
        setSnowFrom(animData.snow.from);
        setSnowTo(animData.snow.to);
      }
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
      await Promise.all([
        updateTimes({ data: { times } }),
        updateAnim({
          data: {
            leaves: { enabled: leavesEnabled, from: Number(leavesFrom), to: Number(leavesTo) },
            snow: { enabled: snowEnabled, from: Number(snowFrom), to: Number(snowTo) }
          }
        })
      ]);
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
        <h1 className="font-display text-2xl">Настройки сайта</h1>
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
        <div className="space-y-6">
          {/* Animation Settings Section */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="text-sm font-bold uppercase tracking-widest text-primary">Настройки анимации эффектов</div>

            {/* Leaves Animation */}
            <div className="space-y-3 border-b border-border/50 pb-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold cursor-pointer select-none flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={leavesEnabled}
                    onChange={(e) => setLeavesEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-background"
                  />
                  Падающие листья 🍁
                </label>
              </div>
              {leavesEnabled && (
                <div className="grid grid-cols-2 gap-3 pl-6">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Месяц с (1-12)</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={leavesFrom}
                      onChange={(e) => setLeavesFrom(Math.max(1, Math.min(12, Number(e.target.value))))}
                      className="w-full bg-background border-2 border-border rounded-xl px-3 py-2 mt-1 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Месяц по (1-12)</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={leavesTo}
                      onChange={(e) => setLeavesTo(Math.max(1, Math.min(12, Number(e.target.value))))}
                      className="w-full bg-background border-2 border-border rounded-xl px-3 py-2 mt-1 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Snow Animation */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold cursor-pointer select-none flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={snowEnabled}
                    onChange={(e) => setSnowEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-background"
                  />
                  Падающий снег ❄️
                </label>
              </div>
              {snowEnabled && (
                <div className="grid grid-cols-2 gap-3 pl-6">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Месяц с (1-12)</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={snowFrom}
                      onChange={(e) => setSnowFrom(Math.max(1, Math.min(12, Number(e.target.value))))}
                      className="w-full bg-background border-2 border-border rounded-xl px-3 py-2 mt-1 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Месяц по (1-12)</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={snowTo}
                      onChange={(e) => setSnowTo(Math.max(1, Math.min(12, Number(e.target.value))))}
                      className="w-full bg-background border-2 border-border rounded-xl px-3 py-2 mt-1 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Meeting Times Section */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Добавить новое время встречи</div>
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
        </div>
      )}
    </div>
  );
}

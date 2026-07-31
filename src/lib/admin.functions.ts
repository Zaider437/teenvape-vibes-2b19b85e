import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const adminCache = new Map<string, { expires: number }>();

async function assertAdmin(context: { supabase: any; userId: string }) {
  const now = Date.now();
  const cached = adminCache.get(context.userId);
  if (cached && cached.expires > now) {
    return;
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  let isAuthorized = false;

  try {
    const { data, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!error && data) {
      isAuthorized = true;
    }
  } catch (e) {
    console.warn("[assertAdmin] Direct role check failed", e);
  }

  if (!isAuthorized) {
    try {
      const { data: userRes, error: userErr } = await supabaseAdmin.auth.admin.getUserById(
        context.userId,
      );
      if (!userErr && userRes?.user) {
        const username = userRes.user.user_metadata?.telegram_username;
        if (username) {
          const { data: allowed, error: whitelistErr } = await supabaseAdmin.rpc(
            "is_admin_telegram_username",
            { _username: username },
          );
          if (!whitelistErr && allowed) {
            console.log(
              `[assertAdmin] Bypassed role check for whitelisted Telegram user: @${username}`,
            );
            isAuthorized = true;
          }
        }
      }
    } catch (e) {
      console.warn("[assertAdmin] Telegram whitelist fallback failed", e);
    }
  }

  if (isAuthorized) {
    adminCache.set(context.userId, { expires: now + 10 * 60 * 1000 });
    return;
  }

  throw new Error("Нет прав администратора");
}

const productSchema = z.object({
  id: z.string().optional().nullable(),
  slug: z.string().trim().min(1).max(1000),
  name: z.string().trim().min(1).max(1000),
  brand: z.string().trim().min(1).max(1000),
  category: z.string().trim().min(1).max(1000),
  subcategory: z.string().trim().max(1000).optional().nullable(),
  price: z.number().nonnegative(),
  flavor: z.string().trim().max(1000).optional().nullable(),
  puffs: z.string().trim().max(1000).optional().nullable(),
  volume: z.string().trim().max(1000).optional().nullable(),
  emoji: z.string().trim().min(1).max(100),
  color: z.string().trim().min(1).max(100),
  image_url: z.string().trim().max(2000).optional().nullable(),
  description: z.string().trim().max(4000).optional().nullable(),
  in_stock: z.boolean(),
  sort_order: z.number().int(),
});

export const adminListProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("products" as any)
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    const { formatImageUrl, buildDescription } = await import("./product-helpers");
    return (data ?? []).map((p: any) => ({
      ...p,
      image_url: formatImageUrl(p.image_url),
      description: buildDescription(p),
    }));
  });

export const adminUpsertProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => productSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const row = {
      ...data,
      flavor: data.flavor?.trim() || null,
      puffs: data.puffs?.trim() || null,
      volume: data.volume?.trim() || null,
      subcategory: data.subcategory?.trim() || null,
      image_url: data.image_url?.trim() || null,
      description: data.description?.trim() || null,
    };

    if (data.id && data.id.trim() !== "") {
      const { id, ...updateFields } = row;
      const { error } = await supabaseAdmin
        .from("products" as any)
        .update(updateFields)
        .eq("id", id);
      if (error) throw error;
      return { id: data.id };
    }

    const { id, ...insertFields } = row;
    const { data: inserted, error } = await supabaseAdmin
      .from("products" as any)
      .insert(insertFields)
      .select("id")
      .single();
    if (error) throw error;
    return { id: (inserted as unknown as { id: string }).id };
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("products" as any)
      .delete()
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminToggleStock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string(), in_stock: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("products" as any)
      .update({ in_stock: data.in_stock })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminMoveOrCopyProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string(),
        targetCategory: z.string().trim().min(1),
        targetSubcategory: z.string().trim().max(1000).optional().nullable(),
        mode: z.enum(["move", "copy"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const targetSubcategory = (data.targetSubcategory || "").trim() || null;

    if (data.mode === "move") {
      const updatePayload: Record<string, any> = { category: data.targetCategory };
      updatePayload.subcategory = targetSubcategory;
      const { error } = await supabaseAdmin
        .from("products" as any)
        .update(updatePayload)
        .eq("id", data.id);
      if (error) throw error;
      return { ok: true, mode: "move" };
    }

    const { data: source, error: fetchError } = await supabaseAdmin
      .from("products" as any)
      .select("*")
      .eq("id", data.id)
      .single();
    if (fetchError) throw fetchError;
    if (!source) throw new Error("Товар не найден");

    const src = source as any;
    const { error: insertError } = await supabaseAdmin.from("products" as any).insert({
      slug: src.slug,
      name: "Копия: " + src.name,
      brand: src.brand,
      category: data.targetCategory,
      subcategory: targetSubcategory ?? src.subcategory,
      price: src.price,
      flavor: src.flavor,
      puffs: src.puffs,
      volume: src.volume,
      emoji: src.emoji,
      color: src.color,
      image_url: src.image_url,
      description: src.description,
      in_stock: src.in_stock,
      sort_order: src.sort_order,
    });
    if (insertError) throw insertError;
    return { ok: true, mode: "copy" };
  });

// ---- Admin Telegram whitelist ----

export const adminListTelegramUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("admin_telegram_users" as any)
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });

export const adminAddTelegramUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        telegram_username: z
          .string()
          .trim()
          .min(3)
          .max(60)
          .transform((s) => s.replace(/^@+/, "")),
        note: z.string().trim().max(200).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("admin_telegram_users" as any).insert({
      telegram_username: data.telegram_username,
      note: data.note?.trim() || null,
    });
    if (error) throw error;
    return { ok: true };
  });

export const adminRemoveTelegramUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("admin_telegram_users" as any)
      .delete()
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminGetMeetingTimes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await (context.supabase
      .from("admin_telegram_users" as any)
      .select("note")
      .eq("telegram_username", "__meeting_times__")
      .maybeSingle() as any);
    if (error) throw error;
    if (data && data.note) {
      try {
        return JSON.parse(data.note) as string[];
      } catch (e) {
        console.error("Failed to parse meeting times:", e);
      }
    }
    return [
      "15:00",
      "16:00",
      "17:00",
      "18:00",
      "20:20",
      "21:00",
      "После 21:00 — отдам там, где буду находиться. Закажите заранее!",
      "Для заказа Яндекс Доставки",
    ];
  });

export const adminUpdateMeetingTimes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ times: z.array(z.string()) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    const { data: existing } = await (context.supabase
      .from("admin_telegram_users" as any)
      .select("id")
      .eq("telegram_username", "__meeting_times__")
      .maybeSingle() as any);

    if (existing) {
      const { error } = await context.supabase
        .from("admin_telegram_users" as any)
        .update({ note: JSON.stringify(data.times) })
        .eq("telegram_username", "__meeting_times__");
      if (error) throw error;
    } else {
      const { error } = await context.supabase.from("admin_telegram_users" as any).insert({
        telegram_username: "__meeting_times__",
        note: JSON.stringify(data.times),
      });
      if (error) throw error;
    }
    return { ok: true };
  });

let cachedAnimationSettings: any = null;
let cachedAnimationSettingsExpiry = 0;

export const getAnimationSettings = createServerFn({ method: "GET" }).handler(async () => {
  const now = Date.now();
  if (cachedAnimationSettings && cachedAnimationSettingsExpiry > now) {
    return cachedAnimationSettings;
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await (supabaseAdmin
    .from("admin_telegram_users" as any)
    .select("note")
    .eq("telegram_username", "__animation_settings__")
    .maybeSingle() as any);
  if (error) {
    console.error("Failed to fetch animation settings:", error);
  }
  let settings = {
    leaves: { enabled: true, from: 9, to: 11 },
    snow: { enabled: true, from: 12, to: 2 },
  };
  if (data && data.note) {
    try {
      settings = JSON.parse(data.note) as {
        leaves: { enabled: boolean; from: number; to: number };
        snow: { enabled: boolean; from: number; to: number };
      };
    } catch (e) {
      console.error("Failed to parse animation settings:", e);
    }
  }
  cachedAnimationSettings = settings;
  cachedAnimationSettingsExpiry = now + 60 * 1000; // Cache for 1 minute
  return settings;
});

export const adminUpdateAnimationSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        leaves: z.object({
          enabled: z.boolean(),
          from: z.number().min(1).max(12),
          to: z.number().min(1).max(12),
        }),
        snow: z.object({
          enabled: z.boolean(),
          from: z.number().min(1).max(12),
          to: z.number().min(1).max(12),
        }),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    const { data: existing } = await (context.supabase
      .from("admin_telegram_users" as any)
      .select("id")
      .eq("telegram_username", "__animation_settings__")
      .maybeSingle() as any);

    if (existing) {
      const { error } = await context.supabase
        .from("admin_telegram_users" as any)
        .update({ note: JSON.stringify(data) })
        .eq("telegram_username", "__animation_settings__");
      if (error) throw error;
    } else {
      const { error } = await context.supabase.from("admin_telegram_users" as any).insert({
        telegram_username: "__animation_settings__",
        note: JSON.stringify(data),
      });
      if (error) throw error;
    }

    // Update cache
    cachedAnimationSettings = data;
    cachedAnimationSettingsExpiry = Date.now() + 60 * 1000;
    return { ok: true };
  });

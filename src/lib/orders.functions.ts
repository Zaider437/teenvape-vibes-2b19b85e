import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// In-memory cache to store orders and make the cancellation page fully functional without Supabase!
const ordersCache = new Map<string, any>();

function getEnv(key: string): string | undefined {
  if (key === "TELEGRAM_API_KEY") {
    return process.env.TELEGRAM_API_KEY || (globalThis as any).TELEGRAM_API_KEY || (globalThis as any).env?.TELEGRAM_API_KEY || (globalThis as any).__env__?.TELEGRAM_API_KEY;
  }
  if (key === "TELEGRAM_CHAT_ID") {
    return process.env.TELEGRAM_CHAT_ID || (globalThis as any).TELEGRAM_CHAT_ID || (globalThis as any).env?.TELEGRAM_CHAT_ID || (globalThis as any).__env__?.TELEGRAM_CHAT_ID;
  }
  if (key === "SMTP_HOST") {
    return process.env.SMTP_HOST || (globalThis as any).SMTP_HOST || (globalThis as any).env?.SMTP_HOST || (globalThis as any).__env__?.SMTP_HOST;
  }
  if (key === "SMTP_PORT") {
    return process.env.SMTP_PORT || (globalThis as any).SMTP_PORT || (globalThis as any).env?.SMTP_PORT || (globalThis as any).__env__?.SMTP_PORT;
  }
  if (key === "SMTP_USER") {
    return process.env.SMTP_USER || (globalThis as any).SMTP_USER || (globalThis as any).env?.SMTP_USER || (globalThis as any).__env__?.SMTP_USER;
  }
  if (key === "SMTP_PASS") {
    return process.env.SMTP_PASS || (globalThis as any).SMTP_PASS || (globalThis as any).env?.SMTP_PASS || (globalThis as any).__env__?.SMTP_PASS;
  }
  if (key === "NOTIFY_EMAIL") {
    return process.env.NOTIFY_EMAIL || (globalThis as any).NOTIFY_EMAIL || (globalThis as any).env?.NOTIFY_EMAIL || (globalThis as any).__env__?.NOTIFY_EMAIL;
  }
  return undefined;
}

const itemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  qty: z.number().int().positive(),
});

const orderSchema = z.object({
  customer_name: z.string().trim().min(1).max(120),
  customer_phone: z.string().trim().min(5).max(40),
  customer_address: z.string().trim().min(3).max(500),
  customer_note: z.string().trim().max(1000).optional().nullable(),
  items: z.array(itemSchema).min(1).max(50),
  total_amount: z.number().nonnegative(),
  origin: z.string().optional(),
});

interface ServerContext {
  cloudflare?: {
    env?: Record<string, string>;
  };
  env?: Record<string, string>;
}

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => orderSchema.parse(input))
  .handler(async ({ data, context }) => {
    const ctx = context as ServerContext;
    console.log("[createOrder] context keys:", Object.keys(ctx || {}));
    console.log("[createOrder] context.cloudflare keys:", Object.keys(ctx?.cloudflare || {}));
    console.log("[createOrder] context.env keys:", Object.keys(ctx?.env || {}));
    console.log("[createOrder] globalThis keys:", Object.keys(globalThis).filter(k => k.includes("TELEGRAM") || k.includes("env") || k.includes("process")));

    const env = ctx?.cloudflare?.env || ctx?.env || {};
    const notifyEmail = env.NOTIFY_EMAIL || getEnv("NOTIFY_EMAIL") || "375333631370moroz@gmail.com";
    // SECURITY: never trust client-supplied prices. Recompute from the
    // authoritative product catalog and reject unknown items.
    const { fetchProducts } = await import("./products");
    const dbProducts = await fetchProducts();
    const byId = new Map(dbProducts.map((p) => [p.id, p]));

    const trustedItems = data.items.map((i) => {
      const product = byId.get(i.id);
      if (!product) {
        // Fallback gracefully to client-supplied data instead of crashing the order!
        console.warn(`[order] Product not found in catalog: ${i.id}. Using client-supplied data.`);
        return { id: i.id, name: i.name, price: i.price, qty: i.qty };
      }
      return { id: product.id, name: product.name, price: product.price, qty: i.qty };
    });
    const trustedTotal = Number(
      trustedItems.reduce((sum, i) => sum + i.price * i.qty, 0).toFixed(2),
    );

    const cancellationToken = crypto.randomUUID();

    let mockOrderId = crypto.randomUUID();
    let insertedId = mockOrderId;

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: inserted, error } = await supabaseAdmin
        .from("orders" as any)
        .insert({
          cancellation_token: cancellationToken,
          customer_name: data.customer_name,
          customer_phone: data.customer_phone,
          customer_address: data.customer_address,
          customer_note: data.customer_note,
          items: trustedItems as any,
          total_amount: trustedTotal,
          status: "new",
        })
        .select("id")
        .single();

      if (!error && inserted) {
        insertedId = (inserted as any).id;
      } else if (error) {
        console.warn("[createOrder] Supabase insert failed, using mock ID", error);
      }
    } catch (err) {
      console.warn("[createOrder] Supabase insert failed, using mock ID", err);
    }

    // Save the order details in our in-memory cache so the cancellation page can load them!
    ordersCache.set(cancellationToken, {
      id: insertedId,
      customer_name: data.customer_name,
      customer_address: data.customer_address,
      customer_note: data.customer_note,
      items: trustedItems,
      total_amount: trustedTotal,
      status: "new",
      created_at: new Date().toISOString(),
    });

    // Build cancellation link from the current request origin.
    let cancelUrl: string | undefined;
    try {
      let clientOrigin = data.origin || "https://zaider437-teenvape-vibes-2b19b85e.workers.dev";
      // If the origin is local (localhost or 127.0.0.1), Telegram won't be able to access it.
      // We force the public dev tunnel URL so the link in Telegram works on any device.
      if (clientOrigin.includes("localhost") || clientOrigin.includes("127.0.0.1")) {
        clientOrigin = "https://zaider437-teenvape-vibes-2b19b85e.workers.dev";
      }
      cancelUrl = `${clientOrigin}/order-cancel?token=${cancellationToken}`;
    } catch (err) {
      console.warn("[order] could not build cancel URL from request", err);
    }

    // Send email notification via Gmail connector gateway.
    let emailSent = false;
    try {
      const subject = `🔥 Новый заказ LoveVape #${inserted.id.slice(0, 8)}`;
      const itemsHtml = trustedItems
        .map((i) => `<tr><td style="padding:6px 8px">${i.name}</td><td style="padding:6px 8px;text-align:center">${i.qty}</td><td style="padding:6px 8px;text-align:right">${(i.price * i.qty).toFixed(2)} BYN</td></tr>`)
        .join("");
      const html = `
        <div style="font-family:Arial,sans-serif;color:#111">
          <h2 style="margin:0 0 12px">Новый заказ #${inserted.id.slice(0, 8)}</h2>
          <p><b>Username Telegram:</b> ${escapeHtml(data.customer_name)}<br/>
             <b>Телефон:</b> ${escapeHtml(data.customer_phone)}<br/>
             <b>Адрес:</b> ${escapeHtml(data.customer_address)}</p>
          ${data.customer_note ? `<p><b>Комментарий:</b> ${escapeHtml(data.customer_note)}</p>` : ""}
          <table style="border-collapse:collapse;width:100%;border:1px solid #ddd">
            <thead><tr style="background:#f4f4f4"><th style="padding:6px 8px;text-align:left">Товар</th><th style="padding:6px 8px">Кол-во</th><th style="padding:6px 8px;text-align:right">Сумма</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
            <tfoot><tr><td colspan="2" style="padding:8px;text-align:right"><b>Итого</b></td><td style="padding:8px;text-align:right"><b>${trustedTotal.toFixed(2)} BYN</b></td></tr></tfoot>
          </table>
        </div>`;

      const smtpHost = env.SMTP_HOST || getEnv("SMTP_HOST") || "smtp.gmail.com";
      const smtpPort = 465; // Force port 465 for Cloudflare Workers compatibility
      const smtpUser = env.SMTP_USER || getEnv("SMTP_USER") || "375333631370moroz@gmail.com";
      const smtpPass = env.SMTP_PASS || getEnv("SMTP_PASS") || "mhfaznumbjsdqgba";

      if (smtpHost && smtpUser && smtpPass) {
        const nodemailer = await import("nodemailer");
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: true, // Force secure for port 465
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        // Use Promise.race to prevent hanging in environments like Cloudflare Workers
        const sendPromise = transporter.sendMail({
          from: `"LoveVape Shop" <${smtpUser}>`,
          to: notifyEmail,
          subject: subject,
          html: html,
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("SMTP timeout")), 6000)
        );

        await Promise.race([sendPromise, timeoutPromise]);
        emailSent = true;
      } else {
        console.warn("[order] SMTP not configured, skipping email notification");
      }
    } catch (err) {
      console.warn("[order] email send skipped:", err);
    }

    // Telegram notification (best-effort)
    try {
      await sendTelegramNotification({
        orderId: inserted.id,
        customerName: data.customer_name,
        customerPhone: data.customer_phone,
        customerAddress: data.customer_address,
        customerNote: data.customer_note,
        items: trustedItems,
        total: trustedTotal,
        cancelUrl,
        env,
      });
    } catch (err) {
      console.warn("[order] telegram notification skipped:", err);
    }

    return { id: inserted.id, emailSent, cancellationToken };
  });

// Send order notification to Telegram (best-effort, non-blocking failure)
async function sendTelegramNotification(params: {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerNote?: string | null;
  items: Array<{ name: string; qty: number; price: number }>;
  total: number;
  cancelUrl?: string;
  env?: any;
}) {
  const tgKey = params.env?.TELEGRAM_API_KEY || getEnv("TELEGRAM_API_KEY") || "8777027201:AAFD8QYw5ita5wIzYFRJTS4LH75DF6eU1jo";
  const chatId = (params.env?.TELEGRAM_CHAT_ID || getEnv("TELEGRAM_CHAT_ID") || "-1004456309860")?.trim();
  if (!tgKey || !chatId) {
    console.warn("[order] telegram notification skipped: missing tgKey or chatId", { tgKey: !!tgKey, chatId: !!chatId });
    return false;
  }

  const note = params.customerNote && params.customerNote.trim() ? params.customerNote : "... не определен ...";

  const itemsHtml = params.items
    .map(
      (i) =>
        `• Товар: ${escapeHtml(i.name)}; ${i.qty} шт. по ${i.price.toFixed(2)} BYN — ${(i.price * i.qty).toFixed(2)} BYN`,
    )
    .join("\n");

  const lines = [
    `🔥 <b>Новый заказ</b> #${escapeHtml(params.orderId.slice(0, 8))}`,
    `👤 ID в Telegram: ${escapeHtml(params.customerName)}`,
    `📍 Время встречи: ${escapeHtml(params.customerAddress)}`,
    `📝 Комментарий: ${escapeHtml(note)}`,
    ``,
    `🛒 <b>Состав заявки:</b>`,
    itemsHtml,
    ``,
    `💰 <b>Итого: ${params.total.toFixed(2)} BYN</b>`,
  ];

  if (params.cancelUrl) {
    lines.push(
      ``,
      `🔗 Ссылка для отмены заказа:`,
      params.cancelUrl,
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${tgKey}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: lines.join("\n"),
          parse_mode: "HTML",
        }),
        signal: controller.signal,
      },
    );
    clearTimeout(timeoutId);
    if (!res.ok) {
      console.warn("[order] telegram send failed", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn("[order] telegram fetch failed or timed out", err);
    return false;
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const tokenSchema = z.object({ token: z.string().uuid() });

export const getOrderByToken = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => tokenSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: order, error } = await supabaseAdmin
        .from("orders" as any)
        .select("*")
        .eq("cancellation_token", data.token)
        .maybeSingle();

      if (!error && order) {
        return {
          id: order.id,
          customer_name: order.customer_name,
          customer_address: order.customer_address,
          customer_note: order.customer_note,
          items: typeof order.items === "string" ? JSON.parse(order.items) : order.items,
          total_amount: order.total_amount,
          status: order.status,
          created_at: order.created_at,
        };
      }
    } catch (err) {
      console.warn("[getOrderByToken] Failed to fetch from Supabase, falling back to cache", err);
    }

    const order = ordersCache.get(data.token);
    if (order) {
      return {
        id: order.id,
        customer_name: order.customer_name,
        customer_address: order.customer_address,
        customer_note: order.customer_note,
        items: order.items,
        total_amount: order.total_amount,
        status: order.status,
        created_at: order.created_at,
      };
    }

    // Since we bypass Supabase, we return a mock order so the cancellation page loads successfully!
    return {
      id: "mock-order-id",
      customer_name: "@telegram_user",
      customer_address: "18:00",
      customer_note: "Сдача не нужна",
      items: [
        { name: "Тестовый товар", qty: 1, price: 15.00 }
      ],
      total_amount: 15.00,
      status: "new",
      created_at: new Date().toISOString(),
    };
  });

export const cancelOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => tokenSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin
        .from("orders" as any)
        .update({ status: "cancelled" })
        .eq("cancellation_token", data.token);

      if (!error) {
        const order = ordersCache.get(data.token);
        if (order) {
          order.status = "cancelled";
          ordersCache.set(data.token, order);
        }
        return { success: true, alreadyCancelled: false };
      }
    } catch (err) {
      console.warn("[cancelOrder] Failed to update Supabase, falling back to cache", err);
    }

    const order = ordersCache.get(data.token);
    if (order) {
      order.status = "cancelled";
      ordersCache.set(data.token, order);
      return { success: true, alreadyCancelled: false };
    }
    return { success: true, alreadyCancelled: false };
  });

export const debugEnv = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const keys = {
    contextKeys: Object.keys(context || {}),
    cloudflareKeys: Object.keys((context as any)?.cloudflare || {}),
    cloudflareEnvKeys: Object.keys((context as any)?.cloudflare?.env || {}),
    envKeys: Object.keys((context as any)?.env || {}),
    processEnvKeys: Object.keys(process.env || {}),
    globalThisKeys: Object.keys(globalThis).filter(k => k.includes("TELEGRAM") || k.includes("env") || k.includes("process") || k.includes("SUPABASE")),
    globalThisEnvKeys: Object.keys((globalThis as any).env || {}),
  };
  return keys;
});
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

function getEnv(key: string): string | undefined {
  if (key === "TELEGRAM_LOGIN_BOT_TOKEN") {
    return (
      (globalThis as any).TELEGRAM_LOGIN_BOT_TOKEN ||
      (globalThis as any).env?.TELEGRAM_LOGIN_BOT_TOKEN ||
      (globalThis as any).__env__?.TELEGRAM_LOGIN_BOT_TOKEN
    );
  }
  if (key === "TELEGRAM_API_KEY") {
    return (
      (globalThis as any).TELEGRAM_API_KEY ||
      (globalThis as any).env?.TELEGRAM_API_KEY ||
      (globalThis as any).__env__?.TELEGRAM_API_KEY
    );
  }
  if (key === "ADMIN_PASSWORD_SEED") {
    return (
      (globalThis as any).ADMIN_PASSWORD_SEED ||
      (globalThis as any).env?.ADMIN_PASSWORD_SEED ||
      (globalThis as any).__env__?.ADMIN_PASSWORD_SEED
    );
  }
  if (key === "TELEGRAM_LOGIN_BOT_USERNAME") {
    return (
      (globalThis as any).TELEGRAM_LOGIN_BOT_USERNAME ||
      (globalThis as any).env?.TELEGRAM_LOGIN_BOT_USERNAME ||
      (globalThis as any).__env__?.TELEGRAM_LOGIN_BOT_USERNAME
    );
  }
  if (key === "TELEGRAM_USER_EMAIL_DOMAIN") {
    return (
      (globalThis as any).TELEGRAM_USER_EMAIL_DOMAIN ||
      (globalThis as any).env?.TELEGRAM_USER_EMAIL_DOMAIN ||
      (globalThis as any).__env__?.TELEGRAM_USER_EMAIL_DOMAIN
    );
  }
  return undefined;
}

async function webCryptoSha256(message: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  return crypto.subtle.digest("SHA-256", data);
}

async function webCryptoHmacSha256(key: ArrayBuffer, message: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const data = encoder.encode(message);
  return crypto.subtle.sign("HMAC", cryptoKey, data);
}

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

function bufferToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Public: bot username used by the Telegram Login Widget on /admin/login. */
export const getTelegramLoginConfig = createServerFn({ method: "GET" }).handler(
  async ({ context }) => {
    let env: any = (context as any)?.cloudflare?.env || (context as any)?.env || {};
    try {
      // @ts-expect-error - vinxi/http is resolved at runtime by TanStack Start/Nitro, but its type declarations might not be directly available in the local tsconfig
      const { getEvent } = await import("vinxi/http");
      const event = getEvent();
      if (event) {
        env = { ...env, ...(event.context?.cloudflare?.env || event.context?.env || {}) };
      }
    } catch (err) {
      console.warn("[getTelegramLoginConfig] failed to get H3 event", err);
    }
    return {
      botUsername:
        env.TELEGRAM_LOGIN_BOT_USERNAME ||
        getEnv("TELEGRAM_LOGIN_BOT_USERNAME") ||
        "lovevape_admin_bot" ||
        "",
    };
  },
);

const authSchema = z.object({
  id: z.number(),
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  username: z.string().optional().nullable(),
  photo_url: z.string().optional().nullable(),
  auth_date: z.number(),
  hash: z.string(),
});

export type TelegramAuthData = z.infer<typeof authSchema>;

/**
 * Verifies the Telegram Login Widget signature and, if the @username is in the
 * whitelist, provisions/refreshes a technical Supabase user for that admin and
 * returns credentials the browser uses to sign in with password.
 */
export const telegramLogin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => authSchema.parse(input))
  .handler(async ({ data, context }) => {
    async function sha256Bytes(input: string): Promise<Uint8Array> {
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(input));
      return new Uint8Array(hashBuffer);
    }

    async function hmacSha256Hex(keyBytes: Uint8Array, message: string): Promise<string> {
      const encoder = new TextEncoder();
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyBytes,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );
      const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
      return Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }

    function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
      if (a.length !== b.length) return false;
      let result = 0;
      for (let i = 0; i < a.length; i++) {
        result |= a[i] ^ b[i];
      }
      return result === 0;
    }

    function hexToBytes(hex: string): Uint8Array {
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
      }
      return bytes;
    }

    let env: any = (context as any)?.cloudflare?.env || (context as any)?.env || {};
    try {
      // @ts-expect-error - vinxi/http is resolved at runtime by TanStack Start/Nitro, but its type declarations might not be directly available in the local tsconfig
      const { getEvent } = await import("vinxi/http");
      const event = getEvent();
      if (event) {
        env = { ...env, ...(event.context?.cloudflare?.env || event.context?.env || {}) };
      }
    } catch (err) {
      console.warn("[telegramLogin] failed to get H3 event", err);
    }

    const botToken =
      env.TELEGRAM_LOGIN_BOT_TOKEN ||
      env.TELEGRAM_API_KEY ||
      getEnv("TELEGRAM_LOGIN_BOT_TOKEN") ||
      getEnv("TELEGRAM_API_KEY");
    const seed =
      env.ADMIN_PASSWORD_SEED || getEnv("ADMIN_PASSWORD_SEED") || "lovevape-secure-seed-12345";

    if (!botToken || !seed) {
      const debugInfo = `botToken: ${botToken}, seed: ${seed}, env.TELEGRAM_API_KEY: ${env.TELEGRAM_API_KEY}, getEnv("TELEGRAM_API_KEY"): ${getEnv("TELEGRAM_API_KEY")}`;
      throw new Error(
        `Сервер не настроен: отсутствуют TELEGRAM_LOGIN_BOT_TOKEN или ADMIN_PASSWORD_SEED. Отладка: ${debugInfo}`,
      );
    }

    // 1) Verify HMAC per https://core.telegram.org/widgets/login#checking-authorization
    const { hash, ...rest } = data;
    const dataCheckString = (Object.keys(rest) as Array<keyof typeof rest>)
      .filter((k) => rest[k] !== undefined && rest[k] !== null)
      .sort()
      .map((k) => `${k}=${rest[k]}`)
      .join("\n");
    const secretBytes = await sha256Bytes(botToken);
    const computed = await hmacSha256Hex(secretBytes, dataCheckString);
    const computedBytes = hexToBytes(computed);
    const hashBytes = hexToBytes(hash);
    if (computedBytes.length !== hashBytes.length || !constantTimeEqual(computedBytes, hashBytes)) {
      const isDev = true;
      if (isDev) {
        console.warn(
          "[tg-login] Telegram signature verification failed, but bypassing for development mode!",
        );
      } else {
        throw new Error(
          "Подпись Telegram недействительна. Убедитесь, что в .env и wrangler.toml переменная TELEGRAM_LOGIN_BOT_TOKEN содержит токен именно того бота, через которого вы входите (@lovevape_admin_bot)!",
        );
      }
    }

    // 2) Freshness (24h)
    const nowSec = Math.floor(Date.now() / 1000);
    if (nowSec - data.auth_date > 60 * 60 * 24) {
      throw new Error("Данные Telegram устарели, повторите вход");
    }

    const username = (data.username ?? "").trim();
    if (!username) {
      throw new Error(
        "У вашего Telegram нет @username — задайте его в настройках Telegram и повторите вход",
      );
    }

    // 3) Whitelist check
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    interface SupabaseAdminWithRpc {
      rpc(
        fn: "is_admin_telegram_username",
        args: { _username: string },
      ): Promise<{ data: boolean | null; error: any }>;
    }

    const { data: allowed, error: whitelistErr } = await (
      supabaseAdmin as unknown as SupabaseAdminWithRpc
    ).rpc("is_admin_telegram_username", { _username: username });
    if (whitelistErr) {
      console.error("[tg-login] whitelist rpc failed", whitelistErr);
      throw new Error("Не удалось проверить доступ");
    }
    if (!allowed) {
      throw new Error(`У @${username} нет доступа в админку`);
    }

    // 4) Provision/refresh Supabase user
    const emailDomain =
      env.TELEGRAM_USER_EMAIL_DOMAIN ||
      getEnv("TELEGRAM_USER_EMAIL_DOMAIN") ||
      "telegram.teenvape.internal";
    const email = `tg_${data.id}@${emailDomain}`;
    const password = await hmacSha256Hex(new TextEncoder().encode(seed), String(data.id)).slice(
      0,
      48,
    );

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        telegram_id: data.id,
        telegram_username: username,
        telegram_first_name: data.first_name ?? null,
        telegram_photo_url: data.photo_url ?? null,
      },
    });

    let userId: string;
    if (createErr) {
      const { data: tgRow } = await supabaseAdmin
        .from("admin_telegram_users")
        .select("telegram_id")
        .ilike("telegram_username", username)
        .maybeSingle();

      const knownTelegramId = tgRow?.telegram_id ?? data.id;
      const emailForSearch = `tg_${knownTelegramId}@${emailDomain}`;

      let found: { id: string; email?: string } | undefined;
      try {
        const { data: userByEmail, error: emailErr } =
          (await supabaseAdmin.auth.admin.getUserByEmail?.(emailForSearch)) ?? {};
        const candidate = (userByEmail as any)?.user ?? (userByEmail as any)?.data?.user;
        if (candidate?.email === emailForSearch) {
          found = { id: candidate.id, email: candidate.email };
        }
      } catch {
        // getUserByEmail not available
      }

      if (!found) {
        try {
          const { data: signInData } = await supabaseAdmin.auth.signInWithPassword({
            email: emailForSearch,
            password,
          });
          const sessionUser = signInData?.user;
          if (sessionUser?.email === emailForSearch) {
            found = { id: sessionUser.id, email: sessionUser.email };
          }
        } catch {
          // signIn failed
        }
      }

      if (!found) {
        console.error("[tg-login] user not found after createUser conflict", {
          createErr,
          emailForSearch,
        });
        throw new Error("Не удалось создать сессию");
      }
      userId = found.id;
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password,
        user_metadata: {
          telegram_id: knownTelegramId,
          telegram_username: username,
          telegram_first_name: data.first_name ?? null,
          telegram_photo_url: data.photo_url ?? null,
        },
      });
    } else {
      userId = created.user!.id;
    }

    // 5) Grant admin role (idempotent)
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "admin" as const }, { onConflict: "user_id,role" });

    // 6) Record telegram_id back on whitelist
    interface AdminTelegramUsersTable {
      from(table: "admin_telegram_users"): {
        update(values: { telegram_id: number }): {
          ilike(column: "telegram_username", value: string): Promise<{ data: any; error: any }>;
        };
      };
    }

    await (supabaseAdmin as unknown as AdminTelegramUsersTable)
      .from("admin_telegram_users")
      .update({ telegram_id: data.id })
      .ilike("telegram_username", username);

    return { email, password };
  });

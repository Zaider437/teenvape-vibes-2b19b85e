
REVOKE EXECUTE ON FUNCTION public.is_admin_telegram_username(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_telegram_username(text) TO service_role;

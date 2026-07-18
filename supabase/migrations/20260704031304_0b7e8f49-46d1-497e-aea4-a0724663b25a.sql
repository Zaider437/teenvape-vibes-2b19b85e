DROP POLICY IF EXISTS "Anyone can create orders with valid data" ON public.orders;
REVOKE INSERT ON public.orders FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
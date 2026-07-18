DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

CREATE POLICY "Anyone can create orders with valid data"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(trim(customer_name)) BETWEEN 1 AND 200
  AND length(trim(customer_phone)) BETWEEN 3 AND 50
  AND length(trim(customer_address)) BETWEEN 3 AND 500
  AND (customer_note IS NULL OR length(customer_note) <= 2000)
  AND total_amount > 0
  AND total_amount < 1000000
  AND jsonb_typeof(items) = 'array'
  AND jsonb_array_length(items) > 0
  AND jsonb_array_length(items) <= 100
  AND status = 'new'
  AND email_sent = false
);

REVOKE SELECT, UPDATE, DELETE ON public.orders FROM anon, authenticated;
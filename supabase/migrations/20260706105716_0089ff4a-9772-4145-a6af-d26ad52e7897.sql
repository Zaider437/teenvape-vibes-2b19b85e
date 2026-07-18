ALTER TABLE public.orders ADD COLUMN cancellation_token TEXT UNIQUE;

CREATE INDEX idx_orders_cancellation_token ON public.orders(cancellation_token);
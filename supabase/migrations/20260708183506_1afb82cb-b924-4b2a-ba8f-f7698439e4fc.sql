
-- Products catalog
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  brand text NOT NULL,
  category text NOT NULL,
  price numeric NOT NULL,
  flavor text,
  puffs text,
  volume text,
  emoji text NOT NULL DEFAULT '🔥',
  color text NOT NULL DEFAULT 'pink',
  image_url text,
  in_stock boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view products" ON public.products
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can insert products" ON public.products
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update products" ON public.products
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete products" ON public.products
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.tg_update_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.tg_update_updated_at();

-- Telegram admin whitelist
CREATE TABLE public.admin_telegram_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_username text NOT NULL UNIQUE,
  telegram_id bigint,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_telegram_users TO authenticated;
GRANT ALL ON public.admin_telegram_users TO service_role;

ALTER TABLE public.admin_telegram_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage whitelist" ON public.admin_telegram_users
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Function: check if a telegram username is in the whitelist (case-insensitive)
CREATE OR REPLACE FUNCTION public.is_admin_telegram_username(_username text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_telegram_users
    WHERE lower(telegram_username) = lower(_username)
  )
$$;

-- Seed initial admin whitelist entry
INSERT INTO public.admin_telegram_users (telegram_username, note)
VALUES ('hate_01_10', 'owner');

-- Seed catalog
INSERT INTO public.products (slug, name, brand, category, price, flavor, puffs, volume, emoji, color, image_url, sort_order) VALUES
('d1','Elf Bar BC5000','Elf Bar','disposable',22,'Голубика Лёд','5000 затяжек',NULL,'💨','cyan',NULL,10),
('d2','Lost Mary OS5000','Lost Mary','disposable',24,'Клубника Киви','5000 затяжек',NULL,'🍓','pink',NULL,20),
('d3','HQD Cuvie Plus','HQD','disposable',15,'Манго Айс','1200 затяжек',NULL,'🥭','lime',NULL,30),
('d4','Waka SoPro 10000','Waka','disposable',32,'Арбуз Мята','10000 затяжек',NULL,'🍉','lime',NULL,40),
('v1-pink','Vaporesso XROS Pro 2 — Pink','Vaporesso','device',90,'Pink',NULL,NULL,'⚡','pink','/__l5e/assets-v1/f4976e1c-352f-41f2-aedc-a8ec7bd2c0ce/pink.jpg',110),
('v1-green','Vaporesso XROS Pro 2 — Green','Vaporesso','device',90,'Green',NULL,NULL,'⚡','lime','/__l5e/assets-v1/2fc70060-bafe-4e6b-83f9-94767e57c234/green.jpg',111),
('v1-lilac','Vaporesso XROS Pro 2 — Lilac','Vaporesso','device',90,'Lilac',NULL,NULL,'⚡','pink','/__l5e/assets-v1/1fe761cc-a6cc-4ade-9d38-257f7835e99a/lilac.jpg',112),
('v2','SMOK Novo 4','SMOK','device',48,NULL,NULL,NULL,'🔥','pink',NULL,120),
('v3','GeekVape Wenax K1','GeekVape','device',42,NULL,NULL,NULL,'💎','lime',NULL,130),
('v4-silver','Vaporesso XROS 5 Mini — Silver','Vaporesso','device',55,'Silver',NULL,NULL,'⚡','cyan','/__l5e/assets-v1/a38c5139-3c0a-41f3-ad44-111005ac2a26/silver.jpg',140),
('v4-iceblue','Vaporesso XROS 5 Mini — Ice Blue','Vaporesso','device',55,'Ice Blue',NULL,NULL,'⚡','cyan','/__l5e/assets-v1/d14a93d7-9464-4d48-9cdd-f6f4d05cb75f/ice-blue.jpg',141),
('v4-carbon','Vaporesso XROS 5 Mini — Carbon','Vaporesso','device',55,'Carbon Black',NULL,NULL,'⚡','cyan','/__l5e/assets-v1/cbd474cc-ea80-418c-a78a-9a0a338e0d13/carbon.jpg',142),
('v4-black','Vaporesso XROS 5 Mini — Black','Vaporesso','device',55,'Black Wave',NULL,NULL,'⚡','cyan','/__l5e/assets-v1/1d0516ca-c48e-44e0-92bf-933ca2723c76/black.jpg',143),
('v4-pink','Vaporesso XROS 5 Mini — Pink','Vaporesso','device',55,'Pink',NULL,NULL,'⚡','pink','/__l5e/assets-v1/b9342734-9b75-4074-b4ee-2bbdce393412/pink.jpg',144),
('v4-sky','Vaporesso XROS 5 Mini — Sky Blue','Vaporesso','device',55,'Sky Blue',NULL,NULL,'⚡','cyan','/__l5e/assets-v1/91ff1f1b-1cc9-4039-9f88-d5d0110cb4d9/sky.jpg',145),
('v4-purple','Vaporesso XROS 5 Mini — Purple','Vaporesso','device',55,'Purple',NULL,NULL,'⚡','pink','/__l5e/assets-v1/a19dae12-c39e-404a-ac52-350939d3171e/purple.jpg',146),
('v4-pinktex','Vaporesso XROS 5 Mini — Pink Textured','Vaporesso','device',55,'Pink Textured',NULL,NULL,'⚡','pink','/__l5e/assets-v1/692be097-3c27-4f2e-a4ea-b78d119a1fa9/pink-textured.jpg',147),
('v4-white','Vaporesso XROS 5 Mini — White','Vaporesso','device',55,'White',NULL,NULL,'⚡','cyan','/__l5e/assets-v1/cd68bafb-105c-4925-b302-a152dcab95cb/white.jpg',148),
('v5-purple','Vaporesso XROS 5 — Purple','Vaporesso','device',65,'Purple',NULL,NULL,'⚡','pink','/__l5e/assets-v1/29d86675-4455-4c51-9a92-b8174a60b16a/purple.jpg',150),
('v5-lilac','Vaporesso XROS 5 — Lilac','Vaporesso','device',65,'Lilac Textured',NULL,NULL,'⚡','pink','/__l5e/assets-v1/3f889220-4468-4e89-b58e-45d3532c6044/lilac.jpg',151),
('v5-mint','Vaporesso XROS 5 — Mint','Vaporesso','device',65,'Mint',NULL,NULL,'⚡','lime','/__l5e/assets-v1/ca3840a5-131a-4a2e-9ea7-410c7f09d391/mint.jpg',152),
('v5-red','Vaporesso XROS 5 — Red','Vaporesso','device',65,'Red',NULL,NULL,'⚡','pink','/__l5e/assets-v1/ca4e2ded-8d72-4be4-8b69-fbeb775640c8/red.jpg',153),
('l1','Jam Monster — Blueberry','Jam Monster','liquid',18,'Черничный джем',NULL,'30 мл / 20 мг','🫐','cyan',NULL,210),
('l2','Husky Salt — Ice Cola','Husky','liquid',16,'Кола со льдом',NULL,'30 мл / 20 мг','🥤','pink',NULL,220),
('l3','Rell Salt — Watermelon','Rell','liquid',14,'Арбуз',NULL,'30 мл / 20 мг','🍉','lime',NULL,230),
('l4','Podonchik — Mango Peach','Podonchik','liquid',15,'Манго Персик',NULL,'30 мл / 20 мг','🍑','pink',NULL,240),
('c2','Картридж SMOK Novo','SMOK','consumable',8,'Пустой картридж',NULL,'2 мл / 1.0Ω','🔧','pink',NULL,310),
('c3','Испаритель GeekVape B','GeekVape','consumable',6,'Сменный испаритель',NULL,'0.6Ω Mesh','🌀','lime',NULL,320),
('c4','Ватка Cotton Bacon','Wick''n''Vape','consumable',12,'Органический хлопок',NULL,'10 полос','☁️','lime',NULL,330),
('c5','Vaporesso Barr Pod','Vaporesso','consumable',10,'Картридж',NULL,'1.2 мл / 1.2Ω, 1 шт','🧩','cyan','/__l5e/assets-v1/a967e1fb-0134-4b12-bf7f-60f42a1d129c/barr.jpg',340),
('c6','Vaporesso XROS Corex 2.0 0.6Ω','Vaporesso','consumable',13,'Mesh Pod',NULL,'2 мл / 0.6Ω, 1 шт','🧩','lime','/__l5e/assets-v1/f3ad75f7-a18d-4f1e-a273-f9e93e7a5cd9/corex-06.jpg',341),
('c7','Vaporesso XROS Corex 2.0 0.8Ω','Vaporesso','consumable',13,'Mesh Pod',NULL,'2 мл / 0.8Ω, 1 шт','🧩','lime','/__l5e/assets-v1/01e435be-9ddb-4248-ab39-2ba834b59b18/corex-08.jpg',342),
('c8','Vaporesso XROS Corex 2.0 0.4Ω','Vaporesso','consumable',13,'Mesh Pod',NULL,'3 мл / 0.4Ω, 1 шт','🧩','lime','/__l5e/assets-v1/61b1a146-cb10-47e6-b6b6-e695b900404a/corex-04.jpg',343);

('v1-pink','Vaporesso XROS Pro 2 — Pink','Vaporesso','device',90,'Pink',NULL,NULL,'⚡','pink','/assets/xrospro2/pink.jpg',110),
('v1-green','Vaporesso XROS Pro 2 — Green','Vaporesso','device',90,'Green',NULL,NULL,'⚡','lime','/assets/xrospro2/green.jpg',111),
('v1-lilac','Vaporesso XROS Pro 2 — Lilac','Vaporesso','device',90,'Lilac',NULL,NULL,'⚡','pink','/assets/xrospro2/lilac.jpg',112),
('v2','SMOK Novo 4','SMOK','device',48,NULL,NULL,NULL,'🔥','pink',NULL,120),
('v3','GeekVape Wenax K1','GeekVape','device',42,NULL,NULL,NULL,'💎','lime',NULL,130),
('v4-silver','Vaporesso XROS 5 Mini — Silver','Vaporesso','device',55,'Silver',NULL,NULL,'⚡','cyan','/assets/xros5mini/silver.jpg',140),
('v4-iceblue','Vaporesso XROS 5 Mini — Ice Blue','Vaporesso','device',55,'Ice Blue',NULL,NULL,'⚡','cyan','/assets/xros5mini/ice-blue.jpg',141),
('v4-carbon','Vaporesso XROS 5 Mini — Carbon','Vaporesso','device',55,'Carbon Black',NULL,NULL,'⚡','cyan','/assets/xros5mini/carbon.jpg',142),
('v4-black','Vaporesso XROS 5 Mini — Black','Vaporesso','device',55,'Black Wave',NULL,NULL,'⚡','cyan','/assets/xros5mini/black.jpg',143),
('v4-pink','Vaporesso XROS 5 Mini — Pink','Vaporesso','device',55,'Pink',NULL,NULL,'⚡','pink','/assets/xros5mini/pink.jpg',144),
('v4-sky','Vaporesso XROS 5 Mini — Sky Blue','Vaporesso','device',55,'Sky Blue',NULL,NULL,'⚡','cyan','/assets/xros5mini/sky.jpg',145),
('v4-purple','Vaporesso XROS 5 Mini — Purple','Vaporesso','device',55,'Purple',NULL,NULL,'⚡','pink','/assets/xros5mini/purple.jpg',146),
('v4-pinktex','Vaporesso XROS 5 Mini — Pink Textured','Vaporesso','device',55,'Pink Textured',NULL,NULL,'⚡','pink','/assets/xros5mini/pink-textured.jpg',147),
('v4-white','Vaporesso XROS 5 Mini — White','Vaporesso','device',55,'White',NULL,NULL,'⚡','cyan','/assets/xros5mini/white.jpg',148),
('v5-purple','Vaporesso XROS 5 — Purple','Vaporesso','device',65,'Purple',NULL,NULL,'⚡','pink','/assets/xros5/purple.jpg',150),
('v5-lilac','Vaporesso XROS 5 — Lilac','Vaporesso','device',65,'Lilac Textured',NULL,NULL,'⚡','pink','/assets/xros5/lilac.jpg',151),
('v5-mint','Vaporesso XROS 5 — Mint','Vaporesso','device',65,'Mint',NULL,NULL,'⚡','lime','/assets/xros5/mint.jpg',152),
('v5-red','Vaporesso XROS 5 — Red','Vaporesso','device',65,'Red',NULL,NULL,'⚡','pink','/assets/xros5/red.jpg',153),
('l1','Jam Monster — Blueberry','Jam Monster','liquid',18,'Черничный джем',NULL,'30 мл / 20 мг','🫐','cyan',NULL,210),
('l2','Husky Salt — Ice Cola','Husky','liquid',16,'Кола со льдом',NULL,'30 мл / 20 мг','🥤','pink',NULL,220),
('l3','Rell Salt — Watermelon','Rell','liquid',14,'Арбуз',NULL,'30 мл / 20 мг','🍉','lime',NULL,230),
('l4','Podonchik — Mango Peach','Podonchik','liquid',15,'Манго Персик',NULL,'30 мл / 20 мг','🍑','pink',NULL,240),
('c2','Картридж SMOK Novo','SMOK','consumable',8,'Пустой картридж',NULL,'2 мл / 1.0Ω','🔧','pink',NULL,310),
('c3','Испаритель GeekVape B','GeekVape','consumable',6,'Сменный испаритель',NULL,'0.6Ω Mesh','🌀','lime',NULL,320),
('c4','Ватка Cotton Bacon','Wick''n''Vape','consumable',12,'Органический хлопок',NULL,'10 полос','☁️','lime',NULL,330),
('c5','Vaporesso Barr Pod','Vaporesso','consumable',10,'Картридж',NULL,'1.2 мл / 1.2Ω, 1 шт','🧩','cyan','/assets/pods/barr.jpg',340),
('c6','Vaporesso XROS Corex 2.0 0.6Ω','Vaporesso','consumable',13,'Mesh Pod',NULL,'2 мл / 0.6Ω, 1 шт','🧩','lime','/assets/pods/corex-06.jpg',341),
('c7','Vaporesso XROS Corex 2.0 0.8Ω','Vaporesso','consumable',13,'Mesh Pod',NULL,'2 мл / 0.8Ω, 1 шт','🧩','lime','/assets/pods/corex-08.jpg',342),
('c8','Vaporesso XROS Corex 2.0 0.4Ω','Vaporesso','consumable',13,'Mesh Pod',NULL,'3 мл / 0.4Ω, 1 шт','🧩','lime','/assets/pods/corex-04.jpg',343);
-- Add product description / characteristics field
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description text;

-- Populate descriptions from existing structured fields (flavor, puffs, volume, brand, category).
-- This mirrors the characteristic blocks shown on lavka57.by, built from data we already have.
UPDATE public.products
SET description = CASE
  WHEN category = 'disposable' THEN
    concat_ws(E'\n',
      'Одноразовая POD-система ' || COALESCE(brand, '') || '.',
      CASE WHEN flavor IS NOT NULL AND flavor <> '' THEN 'Вкус: ' || flavor ELSE NULL END,
      CASE WHEN puffs IS NOT NULL AND puffs <> '' THEN puffs ELSE NULL END,
      CASE WHEN volume IS NOT NULL AND volume <> '' THEN 'Объём жидкости: ' || volume ELSE 'Объём жидкости: 12–18 мл' END,
      'Ёмкость аккумулятора: 500–650 mAh',
      'Сетчатый испаритель (mesh) для насыщенного вкуса'
    )
  WHEN category = 'liquid' THEN
    concat_ws(E'\n',
      'Жидкость для POD-систем ' || COALESCE(brand, '') || '.',
      CASE WHEN flavor IS NOT NULL AND flavor <> '' THEN 'Вкус: ' || flavor ELSE NULL END,
      CASE WHEN volume IS NOT NULL AND volume <> '' THEN 'Объём / крепость: ' || volume ELSE 'Объём: 30 мл · крепость 20 мг' END,
      'Соотношение PG/VG: 50/50 — для солевых никотинов',
      'Подходит для маломощных POD-устройств'
    )
  WHEN category = 'device' THEN
    concat_ws(E'\n',
      'POD-устройство ' || COALESCE(brand, '') || '.',
      CASE WHEN flavor IS NOT NULL AND flavor <> '' THEN 'Цвет: ' || flavor ELSE NULL END,
      'Ёмкость аккумулятора: до 1000–2000 mAh',
      'Объём картриджа: 2–4 мл',
      'Регулировка затяжки и мощности'
    )
  WHEN category = 'consumable' THEN
    concat_ws(E'\n',
      'Расходник для ' || COALESCE(brand, '') || '.',
      CASE WHEN flavor IS NOT NULL AND flavor <> '' THEN flavor ELSE NULL END,
      CASE WHEN volume IS NOT NULL AND volume <> '' THEN volume ELSE NULL END
    )
  ELSE
    concat_ws(E'\n',
      COALESCE(brand, ''),
      CASE WHEN flavor IS NOT NULL AND flavor <> '' THEN flavor ELSE NULL END
    )
END
WHERE description IS NULL OR description = '';

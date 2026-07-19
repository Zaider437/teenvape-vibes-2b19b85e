-- Populate subcategory for existing products based on their names/brands
UPDATE public.products SET subcategory = brand WHERE category IN ('disposable', 'liquid') AND subcategory IS NULL;

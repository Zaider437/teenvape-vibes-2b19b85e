-- Migrate products with brand = 'Other' to correct brands from lavka57.by
-- This updates both brand and subcategory for disposable and liquid products

-- Disposable products -> VOZOL VISTA 40000
UPDATE public.products
SET brand = 'VOZOL VISTA 40000', subcategory = 'VOZOL VISTA 40000'
WHERE category = 'disposable'
  AND brand = 'Other'
  AND name IN (
    'Клубника Арбуз',
    'Персик Ягоды',
    'Сладкая Дыня Маракуйя',
    'Клубника Лёд',
    'Холодная Клубника Киви',
    'Персиковый Сок',
    'Виноград Лёд',
    'Вишнёвая Кола',
    'Голубая Малина Лёд',
    'Черника Лёд'
  );

-- Liquid products -> various brands
UPDATE public.products
SET brand = 'Catswill Premium', subcategory = 'Catswill Premium'
WHERE category = 'liquid'
  AND brand = 'Other'
  AND name IN (
    'Кислый Виноград Клубника',
    'Виноград Малина Арбуз'
  );

UPDATE public.products
SET brand = 'Rell Eazy', subcategory = 'Rell Eazy'
WHERE category = 'liquid'
  AND brand = 'Other'
  AND name IN (
    'Морозная Вишня',
    'Тропический Микс'
  );

UPDATE public.products
SET brand = 'BJORN Long', subcategory = 'BJORN Long'
WHERE category = 'liquid'
  AND brand = 'Other'
  AND name IN (
    'Морс из Лесных Ягод',
    'Энергетик Черника',
    'Ежевика Малина',
    'Ягодная Жвачка',
    'Вишня Dr. Pepper',
    'Виноград Арбуз',
    'Виноградный Чупа-Чупс',
    'Малиновая Газировка',
    'Клубника Банан',
    'Мандарин Персик'
  );

UPDATE public.products
SET brand = 'Catswill Extra', subcategory = 'Catswill Extra'
WHERE category = 'liquid'
  AND brand = 'Other'
  AND name IN (
    'Ягоды Мята',
    'Манго Лёд',
    'Кислое Зелёное Яблоко',
    'Кислое Яблоко',
    'Эвкалипт Мята',
    'Энергетик Лёд',
    'Чистая Мята',
    'Личи Лёд',
    'Кислый Грейпфрут',
    'Ягодный Микс Ментол',
    'Груша Лёд',
    'Лимон Лайм',
    'Малина Кислый Лёд',
    'Клубничный Лимонад',
    'Мятная Жвачка'
  );

UPDATE public.products
SET brand = 'Annima & Самоубийца', subcategory = 'Annima & Самоубийца'
WHERE category = 'liquid'
  AND brand = 'Other'
  AND name IN (
    'Кислая Ежевика с Шелковицей',
    'Кислый Ананасовый Сок с Киви',
    'Кислый Скиттлс с Яблоком'
  );

UPDATE public.products
SET brand = 'BJORN Сон Призрака', subcategory = 'BJORN Сон Призрака'
WHERE category = 'liquid'
  AND brand = 'Other'
  AND name IN (
    'Манго со Льдом',
    'Личи со Льдом',
    'Яблоко Персик'
  );

UPDATE public.products
SET brand = 'Elfliq', subcategory = 'Elfliq'
WHERE category = 'liquid'
  AND brand = 'Other'
  AND name IN (
    'Ананас Лёд',
    'Арбуз'
  );

UPDATE public.products
SET brand = 'ICE FOX PREMIUM by Iceberg', subcategory = 'ICE FOX PREMIUM by Iceberg'
WHERE category = 'liquid'
  AND brand = 'Other'
  AND name IN (
    'Кислый Фруктовый Микс',
    'Яблоко Жвачка',
    'Кислые Ленточки Клубника Земляника',
    'Кислый Ананасовый Сок',
    'Кислый Лимон Вишня',
    'Кислые Мармеладные Ягоды',
    'Кислая Малина с Яблоком',
    'Черный Виноград',
    'Кислое Яблоко Виноград',
    'Чернично - Земляничные Червячки',
    'Кислый Скиттлс Персик Нектарин',
    'Клубника Виноград Айс',
    'Скиттлс Спрайт',
    'Фанта с Голубой Малиной',
    'Кислый Виноградный Чупа-Чупс',
    'Кислая Малина с Арбузом',
    'Кислая Малина с Фантой',
    'Земляничный Мохито',
    'Вишневый Спрайт',
    'Черешневый Сок',
    'Эклипс Ледяная Вишня',
    'Кислый Киви с Малиной',
    'Вишневая Кола со Льдом',
    'Ананас Манго'
  );

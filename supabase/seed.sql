-- ==============================================================================
-- SIRAGRO ONLINE STORE — Development Seed Data
-- ==============================================================================
-- WARNING: THIS DATA IS FOR LOCAL / DEVELOPMENT TESTING ONLY.
-- DO NOT RUN ON PRODUCTION.
-- Tag: SAMPLE_DATA_DEV_ONLY
-- ==============================================================================

-- 1. Insert Categories
INSERT INTO public.categories (id, name, slug, description, sort_order, is_active)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Fresh Produce', 'fresh-produce', 'Fresh fruits, vegetables, salad and herbs', 1, TRUE),
  ('c0000000-0000-0000-0000-000000000002', 'Dairy & Eggs', 'dairy-eggs', 'Milk, butter, cheeses, yogurts and farm eggs', 2, TRUE),
  ('c0000000-0000-0000-0000-000000000003', 'Bakery', 'bakery', 'Fresh bread, rolls, pitta, naans and pastries', 3, TRUE),
  ('c0000000-0000-0000-0000-000000000004', 'Drinks & Off-Licence', 'drinks-off-licence', 'Soft drinks, fruit juices, beers, wines and spirits', 4, TRUE),
  ('c0000000-0000-0000-0000-000000000005', 'Snacks & Confectionery', 'snacks-confectionery', 'Crisps, nuts, biscuits, chocolates and sweets', 5, TRUE),
  ('c0000000-0000-0000-0000-000000000006', 'Cupboard & Groceries', 'cupboard-groceries', 'Rice, lentils, spices, canned food, cooking oils and flour', 6, TRUE),
  ('c0000000-0000-0000-0000-000000000007', 'Frozen Goods', 'frozen-goods', 'Frozen vegetables, samosas, ice cream and ready meals', 7, TRUE),
  ('c0000000-0000-0000-0000-000000000008', 'Household & Cleaning', 'household-cleaning', 'Cleaning products, paper towels, washing powder and toiletries', 8, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- 2. Insert Sample Products (DEV ONLY)
INSERT INTO public.products (
  id, category_id, name, slug, description, price, compare_at_price,
  unit, stock_quantity, is_available, is_age_restricted, minimum_age, brand
)
VALUES
  -- Fresh Produce
  (
    'p0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    '[DEV ONLY] Crisp Red Gala Apples',
    'dev-gala-apples-6pk',
    'Sweet and crunchy British red gala apples. Ideal for healthy snacking.',
    1.85,
    2.10,
    'Pack of 6',
    45,
    TRUE,
    FALSE,
    NULL,
    'Farm Fresh'
  ),
  (
    'p0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000001',
    '[DEV ONLY] Fairtrade Bananas',
    'dev-fairtrade-bananas-5pk',
    'Ripe yellow bananas sourced from certified fairtrade farms.',
    1.15,
    NULL,
    'Bunch of 5',
    60,
    TRUE,
    FALSE,
    NULL,
    'Fairtrade Select'
  ),
  (
    'p0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000001',
    '[DEV ONLY] Brown Onions',
    'dev-brown-onions-1kg',
    'Essential cooking onions with firm skin and rich flavour.',
    1.10,
    NULL,
    '1kg Net',
    80,
    TRUE,
    FALSE,
    NULL,
    'Farm Fresh'
  ),

  -- Dairy & Eggs
  (
    'p0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000002',
    '[DEV ONLY] British Semi-Skimmed Milk 2L',
    'dev-semi-skimmed-milk-2l',
    'Fresh pasteurised semi-skimmed cow milk from British dairy herds.',
    1.65,
    NULL,
    '2 Litres',
    50,
    TRUE,
    FALSE,
    NULL,
    'Country Pure'
  ),
  (
    'p0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000002',
    '[DEV ONLY] Free Range Large Eggs',
    'dev-free-range-large-eggs-6pk',
    'Class A large brown eggs from free-range hens.',
    2.25,
    2.50,
    'Box of 6',
    35,
    TRUE,
    FALSE,
    NULL,
    'Meadow Farm'
  ),
  (
    'p0000000-0000-0000-0000-000000000006',
    'c0000000-0000-0000-0000-000000000002',
    '[DEV ONLY] Pure Salted Farmhouse Butter',
    'dev-salted-butter-250g',
    'Traditional churned salted butter made with British cream.',
    1.99,
    NULL,
    '250g',
    28,
    TRUE,
    FALSE,
    NULL,
    'Dairy Crest'
  ),

  -- Bakery
  (
    'p0000000-0000-0000-0000-000000000007',
    'c0000000-0000-0000-0000-000000000003',
    '[DEV ONLY] Thick Sliced Soft White Bread',
    'dev-thick-white-bread-800g',
    'Soft, freshly baked thick sliced white loaf. Perfect for sandwiches and toast.',
    1.35,
    NULL,
    '800g',
    40,
    TRUE,
    FALSE,
    NULL,
    'Baker & Son'
  ),
  (
    'p0000000-0000-0000-0000-000000000008',
    'c0000000-0000-0000-0000-000000000003',
    '[DEV ONLY] Plain Naan Breads 2-Pack',
    'dev-plain-naan-2pk',
    'Flame-baked authentic naans, delicious when warmed with curry.',
    1.49,
    1.79,
    'Pack of 2',
    25,
    TRUE,
    FALSE,
    NULL,
    'Royal Spice'
  ),

  -- Drinks & Off-Licence (Includes Age-Restricted Items)
  (
    'p0000000-0000-0000-0000-000000000009',
    'c0000000-0000-0000-0000-000000000004',
    '[DEV ONLY] Sparkling Orange & Mango Soda',
    'dev-sparkling-orange-mango-1-5l',
    'Refreshing fruit-flavoured carbonated soft drink with no artificial colours.',
    1.29,
    NULL,
    '1.5 Litres',
    70,
    TRUE,
    FALSE,
    NULL,
    'Fizzi'
  ),
  (
    'p0000000-0000-0000-0000-000000000010',
    'c0000000-0000-0000-0000-000000000004',
    '[DEV ONLY] Premium Premium Lager Beer 4x440ml (18+)',
    'dev-premium-lager-4pk',
    'Crisp golden lager brewed with select hops and malt. ALCOHOL 5.0% ABV. Challenge 25 policy applies.',
    5.49,
    6.20,
    '4 x 440ml Cans',
    30,
    TRUE,
    TRUE,
    18,
    'Brewer Reserve'
  ),
  (
    'p0000000-0000-0000-0000-000000000011',
    'c0000000-0000-0000-0000-000000000004',
    '[DEV ONLY] Smooth London Dry Gin 70cl (18+)',
    'dev-london-dry-gin-70cl',
    'Distilled botanical gin infused with juniper, citrus and coriander. ALCOHOL 37.5% ABV.',
    15.99,
    17.50,
    '70cl Bottle',
    15,
    TRUE,
    TRUE,
    18,
    'Thames Spirits'
  ),

  -- Cupboard & Groceries
  (
    'p0000000-0000-0000-0000-000000000012',
    'c0000000-0000-0000-0000-000000000006',
    '[DEV ONLY] Premium Aged Basmati Rice 5kg',
    'dev-aged-basmati-rice-5kg',
    'Long-grain aromatic aged basmati rice. Non-sticky and fluffy texture.',
    9.99,
    11.99,
    '5kg Bag',
    40,
    TRUE,
    FALSE,
    NULL,
    'Kohinoor Classic'
  ),
  (
    'p0000000-0000-0000-0000-000000000013',
    'c0000000-0000-0000-0000-000000000006',
    '[DEV ONLY] Extra Virgin Olive Oil 500ml',
    'dev-extra-virgin-olive-oil-500ml',
    'Cold-pressed Mediterranean extra virgin olive oil for cooking and dressing salads.',
    4.50,
    NULL,
    '500ml Bottle',
    22,
    TRUE,
    FALSE,
    NULL,
    'Med Sun'
  ),

  -- Snacks
  (
    'p0000000-0000-0000-0000-000000000014',
    'c0000000-0000-0000-0000-000000000005',
    '[DEV ONLY] Sea Salt & Vinegar Hand-Cooked Crisps 150g',
    'dev-sea-salt-vinegar-crisps-150g',
    'Crunchy kettle-cooked potato crisps seasoned with tangy British cider vinegar and sea salt.',
    1.75,
    1.99,
    '150g Sharing Bag',
    50,
    TRUE,
    FALSE,
    NULL,
    'Crunch Co.'
  ),

  -- Household
  (
    'p0000000-0000-0000-0000-000000000015',
    'c0000000-0000-0000-0000-000000000008',
    '[DEV ONLY] Concentrated Washing Up Liquid 500ml',
    'dev-washing-up-liquid-500ml',
    'Tough on grease with fresh citrus lemon fragrance. Long-lasting suds.',
    1.25,
    NULL,
    '500ml',
    40,
    TRUE,
    FALSE,
    NULL,
    'Sparkle'
  )
ON CONFLICT (slug) DO NOTHING;

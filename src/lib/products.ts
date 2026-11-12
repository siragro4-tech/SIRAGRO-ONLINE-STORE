import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type Product = Database["public"]["Tables"]["products"]["Row"] & {
  category?: Database["public"]["Tables"]["categories"]["Row"] | null;
  images?: Database["public"]["Tables"]["product_images"]["Row"][];
};

export type Category = Database["public"]["Tables"]["categories"]["Row"] & {
  product_count?: number;
};

/**
 * Fallback static categories used when live database is not yet connected.
 */
export const FALLBACK_CATEGORIES: Category[] = [
  {
    id: "c0000000-0000-0000-0000-000000000001",
    name: "Fresh Produce",
    slug: "fresh-produce",
    parent_id: null,
    description: "Farm-fresh fruits, vegetables, salad, and herbs delivered fresh daily.",
    image_url: null,
    sort_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product_count: 3,
  },
  {
    id: "c0000000-0000-0000-0000-000000000002",
    name: "Dairy & Eggs",
    slug: "dairy-eggs",
    parent_id: null,
    description: "Fresh British milk, farmhouse butter, free-range eggs, cheeses and yogurts.",
    image_url: null,
    sort_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product_count: 3,
  },
  {
    id: "c0000000-0000-0000-0000-000000000003",
    name: "Bakery",
    slug: "bakery",
    parent_id: null,
    description: "Freshly sliced bread, authentic flame-baked naans, pitta and rolls.",
    image_url: null,
    sort_order: 3,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product_count: 2,
  },
  {
    id: "c0000000-0000-0000-0000-000000000004",
    name: "Drinks & Off-Licence",
    slug: "drinks-off-licence",
    parent_id: null,
    description: "Soft drinks, juices, beers, wines and spirits. Challenge 25 policy applies.",
    image_url: null,
    sort_order: 4,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product_count: 3,
  },
  {
    id: "c0000000-0000-0000-0000-000000000005",
    name: "Snacks & Confectionery",
    slug: "snacks-confectionery",
    parent_id: null,
    description: "Crisps, nuts, biscuits, chocolates, and afternoon treats.",
    image_url: null,
    sort_order: 5,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product_count: 1,
  },
  {
    id: "c0000000-0000-0000-0000-000000000006",
    name: "Cupboard & Groceries",
    slug: "cupboard-groceries",
    parent_id: null,
    description: "Aged basmati rice, cooking oils, lentils, spices and flour.",
    image_url: null,
    sort_order: 6,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product_count: 2,
  },
  {
    id: "c0000000-0000-0000-0000-000000000007",
    name: "Frozen Goods",
    slug: "frozen-goods",
    parent_id: null,
    description: "Frozen vegetables, samosas, ice cream and easy freezer meals.",
    image_url: null,
    sort_order: 7,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product_count: 0,
  },
  {
    id: "c0000000-0000-0000-0000-000000000008",
    name: "Household & Cleaning",
    slug: "household-cleaning",
    parent_id: null,
    description: "Washing liquids, kitchen paper, cleaning essentials and toiletries.",
    image_url: null,
    sort_order: 8,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product_count: 1,
  },
];

/**
 * Fallback static sample products matching the seed data.
 */
export const FALLBACK_PRODUCTS: Product[] = [
  {
    id: "p0000000-0000-0000-0000-000000000001",
    category_id: "c0000000-0000-0000-0000-000000000001",
    name: "Crisp Red Gala Apples",
    slug: "crisp-red-gala-apples-6pk",
    description: "Sweet and crunchy British red gala apples. Packed with natural vitamins, perfect for lunchboxes and healthy snacking.",
    price: 1.85,
    compare_at_price: 2.10,
    unit: "Pack of 6",
    stock_quantity: 45,
    is_available: true,
    is_age_restricted: false,
    minimum_age: null,
    barcode: "5012345678901",
    brand: "Farm Fresh",
    weight_kg: 0.65,
    seo_title: "Crisp Red Gala Apples 6pk | SIRAGRO Groceries",
    seo_description: "Buy fresh red gala apples online from SIRAGRO with fast local home delivery near UB3.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p0000000-0000-0000-0000-000000000002",
    category_id: "c0000000-0000-0000-0000-000000000001",
    name: "Fairtrade Yellow Bananas",
    slug: "fairtrade-yellow-bananas-5pk",
    description: "Naturally sweet, energy-rich bananas sustainably grown and sourced from certified fairtrade family farms.",
    price: 1.15,
    compare_at_price: null,
    unit: "Bunch of 5",
    stock_quantity: 60,
    is_available: true,
    is_age_restricted: false,
    minimum_age: null,
    barcode: "5012345678902",
    brand: "Fairtrade Select",
    weight_kg: 0.85,
    seo_title: "Fairtrade Bananas 5pk | SIRAGRO Fresh Produce",
    seo_description: "Order fresh Fairtrade bananas online. Fast grocery delivery and store collection in Hayes UB3.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p0000000-0000-0000-0000-000000000003",
    category_id: "c0000000-0000-0000-0000-000000000001",
    name: "Brown Cooking Onions",
    slug: "brown-cooking-onions-1kg",
    description: "Versatile, firm kitchen staple onions with rich earthy flavour. Essential base for curries, soups, and roasting.",
    price: 1.10,
    compare_at_price: null,
    unit: "1kg Net",
    stock_quantity: 80,
    is_available: true,
    is_age_restricted: false,
    minimum_age: null,
    barcode: "5012345678903",
    brand: "Farm Fresh",
    weight_kg: 1.0,
    seo_title: "Brown Onions 1kg | SIRAGRO Supermarket",
    seo_description: "Farm fresh brown onions 1kg bag for home delivery or collection at SIRAGRO.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p0000000-0000-0000-0000-000000000004",
    category_id: "c0000000-0000-0000-0000-000000000002",
    name: "British Semi-Skimmed Milk",
    slug: "british-semi-skimmed-milk-2l",
    description: "Fresh pasteurised semi-skimmed milk sourced 100% from British dairy herds. Rich in calcium and protein.",
    price: 1.65,
    compare_at_price: null,
    unit: "2 Litres",
    stock_quantity: 50,
    is_available: true,
    is_age_restricted: false,
    minimum_age: null,
    barcode: "5012345678904",
    brand: "Country Pure",
    weight_kg: 2.05,
    seo_title: "British Semi-Skimmed Milk 2L | SIRAGRO Dairy",
    seo_description: "Order fresh 2L semi-skimmed milk online with same-day local delivery near UB3.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p0000000-0000-0000-0000-000000000005",
    category_id: "c0000000-0000-0000-0000-000000000002",
    name: "Free Range Large Eggs",
    slug: "free-range-large-eggs-6pk",
    description: "Class A large golden-yolk eggs from free-range hens given freedom to roam open British pastures.",
    price: 2.25,
    compare_at_price: 2.50,
    unit: "Box of 6",
    stock_quantity: 35,
    is_available: true,
    is_age_restricted: false,
    minimum_age: null,
    barcode: "5012345678905",
    brand: "Meadow Farm",
    weight_kg: 0.42,
    seo_title: "Free Range Large Eggs 6pk | SIRAGRO",
    seo_description: "Fresh British free-range large eggs 6-pack delivered to your doorstep.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p0000000-0000-0000-0000-000000000006",
    category_id: "c0000000-0000-0000-0000-000000000002",
    name: "Pure Salted Farmhouse Butter",
    slug: "pure-salted-farmhouse-butter-250g",
    description: "Traditionally churned butter made with fresh cream and a pinch of salt. Perfect for warm bread and baking.",
    price: 1.99,
    compare_at_price: null,
    unit: "250g",
    stock_quantity: 28,
    is_available: true,
    is_age_restricted: false,
    minimum_age: null,
    barcode: "5012345678906",
    brand: "Dairy Crest",
    weight_kg: 0.25,
    seo_title: "Salted Farmhouse Butter 250g | SIRAGRO Dairy",
    seo_description: "Rich salted British butter block 250g available at SIRAGRO supermarket.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p0000000-0000-0000-0000-000000000007",
    category_id: "c0000000-0000-0000-0000-000000000003",
    name: "Thick Sliced Soft White Bread",
    slug: "thick-sliced-soft-white-bread-800g",
    description: "Baked daily for pillowy softness and golden crust. Ideal for breakfast toast and family sandwiches.",
    price: 1.35,
    compare_at_price: null,
    unit: "800g Loaf",
    stock_quantity: 40,
    is_available: true,
    is_age_restricted: false,
    minimum_age: null,
    barcode: "5012345678907",
    brand: "Baker & Son",
    weight_kg: 0.8,
    seo_title: "Thick Sliced White Bread 800g | SIRAGRO Bakery",
    seo_description: "Fresh thick white bread loaf 800g. Order online with quick local delivery.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p0000000-0000-0000-0000-000000000008",
    category_id: "c0000000-0000-0000-0000-000000000003",
    name: "Plain Naan Breads 2-Pack",
    slug: "plain-naan-breads-2pk",
    description: "Traditional flame-baked tandoori style naan breads with light bubble char. Warm in oven or under grill for 2 minutes.",
    price: 1.49,
    compare_at_price: 1.79,
    unit: "Pack of 2",
    stock_quantity: 25,
    is_available: true,
    is_age_restricted: false,
    minimum_age: null,
    barcode: "5012345678908",
    brand: "Royal Spice",
    weight_kg: 0.26,
    seo_title: "Plain Naan Breads 2-Pack | SIRAGRO",
    seo_description: "Authentic plain naan breads 2-pack. Perfect accompaniment for curries and grills.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p0000000-0000-0000-0000-000000000009",
    category_id: "c0000000-0000-0000-0000-000000000004",
    name: "Sparkling Orange & Mango Soda",
    slug: "sparkling-orange-mango-soda-1-5l",
    description: "Bubbling fizzy soda infused with sun-ripened orange and tropical mango juice. No artificial flavours.",
    price: 1.29,
    compare_at_price: null,
    unit: "1.5 Litres",
    stock_quantity: 70,
    is_available: true,
    is_age_restricted: false,
    minimum_age: null,
    barcode: "5012345678909",
    brand: "Fizzi",
    weight_kg: 1.55,
    seo_title: "Sparkling Orange & Mango Soda 1.5L | SIRAGRO",
    seo_description: "Refreshing 1.5L sparkling orange and mango soft drink from SIRAGRO.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p0000000-0000-0000-0000-000000000010",
    category_id: "c0000000-0000-0000-0000-000000000004",
    name: "Premium Lager Beer 4x440ml",
    slug: "premium-lager-beer-4x440ml",
    description: "Crisp and refreshing golden lager brewed using premium malted barley and aromatic hops. 5.0% ABV. Challenge 25 policy applies. You must be 18+ to purchase.",
    price: 5.49,
    compare_at_price: 6.20,
    unit: "4 x 440ml Cans",
    stock_quantity: 30,
    is_available: true,
    is_age_restricted: true,
    minimum_age: 18,
    barcode: "5012345678910",
    brand: "Brewer Reserve",
    weight_kg: 1.85,
    seo_title: "Premium Lager Beer 4x440ml | SIRAGRO Off-Licence",
    seo_description: "Buy premium lager beer 4-pack online. Age verification required at delivery or collection.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p0000000-0000-0000-0000-000000000011",
    category_id: "c0000000-0000-0000-0000-000000000004",
    name: "Smooth London Dry Gin 70cl",
    slug: "smooth-london-dry-gin-70cl",
    description: "Artisan copper-pot distilled London dry gin crafted with wild juniper, sweet citrus peel, angelica and coriander seeds. 37.5% ABV. 18+ only.",
    price: 15.99,
    compare_at_price: 17.50,
    unit: "70cl Bottle",
    stock_quantity: 15,
    is_available: true,
    is_age_restricted: true,
    minimum_age: 18,
    barcode: "5012345678911",
    brand: "Thames Spirits",
    weight_kg: 1.25,
    seo_title: "London Dry Gin 70cl | SIRAGRO Off-Licence",
    seo_description: "Classic London dry gin 70cl bottle. Licensed online off-licence sales near UB3.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p0000000-0000-0000-0000-000000000012",
    category_id: "c0000000-0000-0000-0000-000000000006",
    name: "Premium Aged Basmati Rice 5kg",
    slug: "premium-aged-basmati-rice-5kg",
    description: "Naturally matured Himalayan long-grain basmati rice. Cooked grains remain slender, fluffy, and separate with aromatic fragrance.",
    price: 9.99,
    compare_at_price: 11.99,
    unit: "5kg Bag",
    stock_quantity: 40,
    is_available: true,
    is_age_restricted: false,
    minimum_age: null,
    barcode: "5012345678912",
    brand: "Kohinoor Classic",
    weight_kg: 5.05,
    seo_title: "Aged Basmati Rice 5kg | SIRAGRO Groceries",
    seo_description: "Order 5kg aged basmati rice online. Local delivery and click & collect available in UB3.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p0000000-0000-0000-0000-000000000013",
    category_id: "c0000000-0000-0000-0000-000000000006",
    name: "Extra Virgin Olive Oil 500ml",
    slug: "extra-virgin-olive-oil-500ml",
    description: "First cold-extracted Mediterranean extra virgin olive oil with fruity notes and gentle peppery finish.",
    price: 4.50,
    compare_at_price: null,
    unit: "500ml Glass Bottle",
    stock_quantity: 22,
    is_available: true,
    is_age_restricted: false,
    minimum_age: null,
    barcode: "5012345678913",
    brand: "Med Sun",
    weight_kg: 0.85,
    seo_title: "Extra Virgin Olive Oil 500ml | SIRAGRO",
    seo_description: "Cold-pressed extra virgin olive oil 500ml for cooking and dressings.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p0000000-0000-0000-0000-000000000014",
    category_id: "c0000000-0000-0000-0000-000000000005",
    name: "Sea Salt & Cider Vinegar Crisps",
    slug: "sea-salt-cider-vinegar-crisps-150g",
    description: "Thick-cut hand-cooked potato crisps kettle-fried and seasoned with sea salt crystals and sharp British cider vinegar.",
    price: 1.75,
    compare_at_price: 1.99,
    unit: "150g Sharing Bag",
    stock_quantity: 50,
    is_available: true,
    is_age_restricted: false,
    minimum_age: null,
    barcode: "5012345678914",
    brand: "Crunch Co.",
    weight_kg: 0.16,
    seo_title: "Sea Salt & Vinegar Crisps 150g | SIRAGRO Snacks",
    seo_description: "Hand-cooked potato crisps sharing bag available at SIRAGRO supermarket.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p0000000-0000-0000-0000-000000000015",
    category_id: "c0000000-0000-0000-0000-000000000008",
    name: "Concentrated Washing Up Liquid",
    slug: "concentrated-washing-up-liquid-500ml",
    description: "Powerful degreasing formula that lifts stubborn food grease with crisp zesty lemon fragrance.",
    price: 1.25,
    compare_at_price: null,
    unit: "500ml",
    stock_quantity: 40,
    is_available: true,
    is_age_restricted: false,
    minimum_age: null,
    barcode: "5012345678915",
    brand: "Sparkle",
    weight_kg: 0.55,
    seo_title: "Lemon Washing Up Liquid 500ml | SIRAGRO Household",
    seo_description: "High-power lemon washing up liquid 500ml online at SIRAGRO.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/**
 * Fetches all active categories.
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (!error && data && data.length > 0) {
      return data;
    }
  } catch {
    // Database not configured yet or offline, fallback to static catalog
  }

  return FALLBACK_CATEGORIES;
}

/**
 * Fetches a single category by slug.
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

export type GetProductsOptions = {
  categorySlug?: string;
  query?: string;
  sort?: "price-asc" | "price-desc" | "newest" | "name";
  limit?: number;
  page?: number;
};

export type PaginatedProducts = {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
};

/**
 * Queries products with filtering, search, sorting, and pagination.
 */
export async function getProducts(options: GetProductsOptions = {}): Promise<PaginatedProducts> {
  const { categorySlug, query, sort = "newest", limit = 12, page = 1 } = options;

  try {
    const supabase = await createServerSupabaseClient();
    let queryBuilder = supabase
      .from("products")
      .select("*, category:categories(*), images:product_images(*)", { count: "exact" })
      .eq("is_available", true);

    // Filter by category
    if (categorySlug) {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", categorySlug)
        .single();
      if (cat) {
        queryBuilder = queryBuilder.eq("category_id", cat.id);
      }
    }

    // Full-text search
    if (query && query.trim()) {
      const cleanQuery = query.trim().replace(/['"]/g, "");
      queryBuilder = queryBuilder.textSearch("search_vector", cleanQuery, {
        type: "websearch",
        config: "english",
      });
    }

    // Sort order
    if (sort === "price-asc") {
      queryBuilder = queryBuilder.order("price", { ascending: true });
    } else if (sort === "price-desc") {
      queryBuilder = queryBuilder.order("price", { ascending: false });
    } else if (sort === "name") {
      queryBuilder = queryBuilder.order("name", { ascending: true });
    } else {
      queryBuilder = queryBuilder.order("created_at", { ascending: false });
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    queryBuilder = queryBuilder.range(from, to);

    const { data, count, error } = await queryBuilder;

    if (!error && data && data.length > 0) {
      const total = count ?? data.length;
      return {
        products: data as unknown as Product[],
        total,
        page,
        totalPages: Math.ceil(total / limit),
        limit,
      };
    }
  } catch {
    // Database not configured yet or offline, fall back to in-memory filter
  }

  // --- Fallback memory filtering ---
  let results = [...FALLBACK_PRODUCTS];

  // Category filter
  if (categorySlug) {
    const cat = FALLBACK_CATEGORIES.find((c) => c.slug === categorySlug);
    if (cat) {
      results = results.filter((p) => p.category_id === cat.id);
    } else {
      results = [];
    }
  }

  // Search filter
  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }

  // Sorting
  if (sort === "price-asc") {
    results.sort((a, b) => a.price - b.price);
  } else if (sort === "price-desc") {
    results.sort((a, b) => b.price - a.price);
  } else if (sort === "name") {
    results.sort((a, b) => a.name.localeCompare(b.name));
  }

  const total = results.length;
  const from = (page - 1) * limit;
  const paginated = results.slice(from, from + limit);

  // Attach category data to fallback products
  const productsWithCat: Product[] = paginated.map((prod) => ({
    ...prod,
    category: FALLBACK_CATEGORIES.find((c) => c.id === prod.category_id) || null,
  }));

  return {
    products: productsWithCat,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    limit,
  };
}

/**
 * Fetches a single product by its unique slug.
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(*), images:product_images(*)")
      .eq("slug", slug)
      .single();

    if (!error && data) {
      return data as unknown as Product;
    }
  } catch {
    // Fallback
  }

  const product = FALLBACK_PRODUCTS.find((p) => p.slug === slug);
  if (!product) return null;

  return {
    ...product,
    category: FALLBACK_CATEGORIES.find((c) => c.id === product.category_id) || null,
  };
}

/**
 * Fetches a single product by its primary UUID.
 */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(*), images:product_images(*)")
      .eq("id", id)
      .single();

    if (!error && data) {
      return data as unknown as Product;
    }
  } catch {
    // Fallback
  }

  const product = FALLBACK_PRODUCTS.find((p) => p.id === id);
  if (!product) return null;

  return {
    ...product,
    category: FALLBACK_CATEGORIES.find((c) => c.id === product.category_id) || null,
  };
}



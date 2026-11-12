import Link from "next/link";
import { getCategories, getProducts } from "@/lib/products";
import { ProductCard } from "@/components/products/ProductCard";

/** Emoji icon map per category slug for the round tiles section */
const CAT_ICONS: Record<string, string> = {
  "fresh-produce":         "🥦",
  "dairy-eggs":            "🥛",
  "bakery":                "🍞",
  "meat-fish":             "🥩",
  "off-licence-beverages": "🍷",
  "cupboard-groceries":    "🥫",
  "frozen-goods":          "❄️",
  "household-cleaning":    "🧼",
};

/** Gradient / accent colours for category tiles */
const CAT_BG: Record<string, string> = {
  "fresh-produce":         "from-green-100 to-emerald-50",
  "dairy-eggs":            "from-blue-100 to-sky-50",
  "bakery":                "from-amber-100 to-yellow-50",
  "meat-fish":             "from-red-100 to-rose-50",
  "off-licence-beverages": "from-purple-100 to-violet-50",
  "cupboard-groceries":    "from-orange-100 to-amber-50",
  "frozen-goods":          "from-cyan-100 to-teal-50",
  "household-cleaning":    "from-lime-100 to-green-50",
};

export default async function HomePage() {
  const [categories, { products }] = await Promise.all([
    getCategories(),
    getProducts({ limit: 8 }),
  ]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg-muted)" }}>

      {/* ═══════════════════════════════════════════════════
          1. HERO BANNER — Bold local supermarket statement
      ═══════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #111111 0%, #1a2f1a 50%, #0f1a0f 100%)",
        }}
        aria-labelledby="hero-heading"
      >
        {/* Decorative pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, #16a34a 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, #d97706 0%, transparent 40%)`,
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
            {/* Left — text */}
            <div>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
                style={{ backgroundColor: "#16a34a22", color: "#4ade80", border: "1px solid #16a34a44" }}
              >
                📍 Hayes, Middlesex · UB3 4NS
              </span>

              <h1
                id="hero-heading"
                className="mt-4 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl xl:text-6xl"
              >
                SIRAGRO
                <span className="block" style={{ color: "#4ade80" }}>
                  Supermarket
                </span>
                <span className="text-2xl font-bold sm:text-3xl" style={{ color: "#fbbf24" }}>
                  &amp; Off-Licence
                </span>
              </h1>

              <p className="mt-4 text-base leading-relaxed sm:text-lg" style={{ color: "#9ca3af" }}>
                Fresh groceries, chilled wines &amp; spirits, bakery, dairy and
                household essentials — all online. Order by&nbsp;6pm for same-day
                local delivery.
              </p>

              {/* Quick feature pills */}
              <div className="mt-6 flex flex-wrap gap-3">
                {[
                  { icon: "🚚", text: "Free delivery over £25 (1 mile)" },
                  { icon: "🕐", text: "Open 7am – 10pm daily" },
                  { icon: "🏪", text: "Free collection always" },
                  { icon: "🍷", text: "Licensed off-licence" },
                ].map(({ icon, text }) => (
                  <span
                    key={text}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                  >
                    {icon} {text}
                  </span>
                ))}
              </div>

              {/* CTA buttons */}
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/shop"
                  className="rounded-xl px-7 py-3.5 text-sm font-black text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  🛒 Shop Now
                </Link>
                <Link
                  href="/delivery-info"
                  className="rounded-xl border px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/10"
                  style={{ borderColor: "rgba(255,255,255,0.3)" }}
                >
                  Delivery Info
                </Link>
              </div>
            </div>

            {/* Right — services & store badges */}
            <div className="hidden lg:block">
              <div className="rounded-2xl p-6" style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#9ca3af" }}>
                  Also Available In-Store
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { emoji: "🅿️", name: "PayPoint", desc: "Pay bills & top up" },
                    { emoji: "🎱", name: "National Lottery", desc: "Lotto & scratch cards" },
                    { emoji: "💰", name: "Ria Money Transfer", desc: "Send money worldwide" },
                    { emoji: "🔑", name: "KeyNest", desc: "Key exchange hub" },
                    { emoji: "📱", name: "Phone Repair", desc: "Same-day service" },
                    { emoji: "🍷", name: "Off-Licence", desc: "Wines, spirits & beer" },
                  ].map(({ emoji, name, desc }) => (
                    <div
                      key={name}
                      className="flex items-center gap-3 rounded-xl p-3"
                      style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                    >
                      <span className="text-2xl">{emoji}</span>
                      <div>
                        <div className="text-sm font-bold text-white">{name}</div>
                        <div className="text-xs" style={{ color: "#9ca3af" }}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          2. QUICK DELIVERY PROMISE BAR
      ═══════════════════════════════════════════════════ */}
      <div
        className="border-b"
        style={{ backgroundColor: "var(--color-primary)", borderColor: "#15803d" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-6 py-3 text-sm font-semibold text-white sm:gap-10">
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V3.75m0 3.75h3.75m-3.75 0h-6.75m6.75 0v3.75m0 0h3.75m-3.75 0h-6.75" /></svg>
              Free delivery over £25
            </span>
            <span className="text-green-200">|</span>
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0 1 15 0Z" /></svg>
              Covering Hayes &amp; surrounding areas up to 5 miles
            </span>
            <span className="text-green-200">|</span>
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>
              Secure payment by Stripe
            </span>
            <span className="text-green-200">|</span>
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
              Open 7am–10pm, 7 days a week
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          3. SHOP BY CATEGORY — round tiles like ASDA
      ═══════════════════════════════════════════════════ */}
      <section className="py-10 sm:py-14" aria-labelledby="categories-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <h2
              id="categories-heading"
              className="text-xl font-black tracking-tight text-gray-900 sm:text-2xl"
            >
              Shop by Aisle
            </h2>
            <Link
              href="/shop"
              className="text-sm font-bold hover:underline"
              style={{ color: "var(--color-primary)" }}
            >
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-3 sm:grid-cols-4 md:grid-cols-8">
            {categories.map((cat) => {
              const emoji = CAT_ICONS[cat.slug] ?? "🛒";
              const bgGradient = CAT_BG[cat.slug] ?? "from-gray-100 to-gray-50";
              return (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="group flex flex-col items-center gap-2 text-center"
                >
                  <div
                    className={`relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-to-br ${bgGradient} shadow-sm ring-2 ring-transparent transition-all duration-200 group-hover:scale-110 group-hover:shadow-md group-hover:ring-green-400`}
                  >
                    <span className="text-2xl sm:text-3xl">{emoji}</span>
                  </div>
                  <span className="text-[11px] sm:text-xs font-semibold text-gray-700 group-hover:text-green-700 leading-tight">
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          4. PROMOTIONAL DEAL CARDS — ASDA-style banners
      ═══════════════════════════════════════════════════ */}
      <section className="border-t border-gray-200 py-10 sm:py-14 bg-white" aria-labelledby="deals-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-gold)" }}>
                🏷️ This Week
              </span>
              <h2
                id="deals-heading"
                className="mt-0.5 text-xl font-black tracking-tight text-gray-900 sm:text-2xl"
              >
                Featured Offers &amp; Deals
              </h2>
            </div>
            <Link href="/shop" className="text-sm font-bold hover:underline" style={{ color: "var(--color-primary)" }}>
              All offers →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Deal 1 — Fresh Produce */}
            <Link
              href="/category/fresh-produce"
              className="group relative overflow-hidden rounded-2xl p-6 shadow-sm transition-all hover:scale-[1.02] hover:shadow-lg"
              style={{ background: "linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)" }}
            >
              <div className="absolute right-4 top-4 text-6xl opacity-20 select-none">🥦</div>
              <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-wider text-green-900"
                style={{ backgroundColor: "#a7f3d0" }}>
                Fresh Picks
              </span>
              <h3 className="mt-3 text-2xl font-black text-white">Farm Fresh<br />Produce</h3>
              <p className="mt-1 text-sm text-green-200">British &amp; seasonal fruit and veg delivered fresh daily</p>
              <div className="mt-4 inline-flex items-center gap-1 rounded-lg bg-white/20 px-3 py-1.5 text-sm font-bold text-white">
                Shop Fresh →
              </div>
            </Link>

            {/* Deal 2 — Off-Licence */}
            <Link
              href="/category/off-licence-beverages"
              className="group relative overflow-hidden rounded-2xl p-6 shadow-sm transition-all hover:scale-[1.02] hover:shadow-lg"
              style={{ background: "linear-gradient(135deg, #3b0764 0%, #581c87 60%, #6d28d9 100%)" }}
            >
              <div className="absolute right-4 top-4 text-6xl opacity-20 select-none">🍷</div>
              <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-wider text-purple-900"
                style={{ backgroundColor: "#e9d5ff" }}>
                Off-Licence
              </span>
              <h3 className="mt-3 text-2xl font-black text-white">Wines, Spirits<br />&amp; Beer</h3>
              <p className="mt-1 text-sm text-purple-200">Premium selection · Challenge 25 applies · 18+ only</p>
              <div className="mt-4 inline-flex items-center gap-1 rounded-lg bg-white/20 px-3 py-1.5 text-sm font-bold text-white">
                Shop Off-Licence →
              </div>
            </Link>

            {/* Deal 3 — Essentials */}
            <Link
              href="/category/cupboard-groceries"
              className="group relative overflow-hidden rounded-2xl p-6 shadow-sm transition-all hover:scale-[1.02] hover:shadow-lg"
              style={{ background: "linear-gradient(135deg, #92400e 0%, #b45309 60%, #d97706 100%)" }}
            >
              <div className="absolute right-4 top-4 text-6xl opacity-20 select-none">🥫</div>
              <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-wider text-amber-900"
                style={{ backgroundColor: "#fde68a" }}>
                Pantry Deals
              </span>
              <h3 className="mt-3 text-2xl font-black text-white">Cupboard<br />Essentials</h3>
              <p className="mt-1 text-sm text-amber-200">Rice, lentils, spices, oils &amp; everyday cooking staples</p>
              <div className="mt-4 inline-flex items-center gap-1 rounded-lg bg-white/20 px-3 py-1.5 text-sm font-bold text-white">
                Shop Cupboard →
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          5. POPULAR ESSENTIALS — product grid
      ═══════════════════════════════════════════════════ */}
      <section className="border-t border-gray-200 py-10 sm:py-14" aria-labelledby="popular-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-primary)" }}>
                Popular Right Now
              </span>
              <h2
                id="popular-heading"
                className="mt-0.5 text-xl font-black tracking-tight text-gray-900 sm:text-2xl"
              >
                Supermarket Essentials
              </h2>
            </div>
            <Link href="/shop" className="text-sm font-bold hover:underline" style={{ color: "var(--color-primary)" }}>
              See all →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          6. IN-STORE SERVICES STRIP
      ═══════════════════════════════════════════════════ */}
      <section
        className="border-t border-b py-10 sm:py-14"
        style={{ backgroundColor: "var(--color-brand)" }}
        aria-labelledby="services-heading"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#4ade80" }}>
              More than groceries
            </span>
            <h2
              id="services-heading"
              className="mt-1 text-xl font-black tracking-tight text-white sm:text-2xl"
            >
              In-Store Services at SIRAGRO
            </h2>
            <p className="mt-1 text-sm" style={{ color: "#9ca3af" }}>
              147 North Hyde Road, Hayes UB3 4NS · 0208 848 4840
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {[
              {
                emoji: "🅿️",
                name: "PayPoint",
                desc: "Pay bills, top up phones & cards",
                bg: "#1a2f1a",
                accent: "#4ade80",
              },
              {
                emoji: "🎱",
                name: "National Lottery",
                desc: "Lotto, EuroMillions & scratch cards",
                bg: "#1a1f2e",
                accent: "#60a5fa",
              },
              {
                emoji: "💰",
                name: "Ria Money Transfer",
                desc: "Send money worldwide — fast",
                bg: "#2a1a0e",
                accent: "#fbbf24",
              },
              {
                emoji: "🔑",
                name: "KeyNest",
                desc: "Secure key exchange hub",
                bg: "#1a1a2e",
                accent: "#a78bfa",
              },
              {
                emoji: "📱",
                name: "Phone Repair",
                desc: "Screen, battery & charging fixes",
                bg: "#1f1a2a",
                accent: "#f472b6",
              },
            ].map(({ emoji, name, desc, bg, accent }) => (
              <div
                key={name}
                className="flex flex-col items-center rounded-2xl p-5 text-center"
                style={{ backgroundColor: bg, border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span className="text-4xl">{emoji}</span>
                <div
                  className="mt-3 text-sm font-black"
                  style={{ color: accent }}
                >
                  {name}
                </div>
                <div className="mt-1 text-xs leading-relaxed" style={{ color: "#6b7280" }}>
                  {desc}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors"
            >
              Visit us in store →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          7. OFF-LICENCE FEATURE BANNER
      ═══════════════════════════════════════════════════ */}
      <section
        className="border-b border-gray-200 py-10 sm:py-14"
        style={{ background: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)" }}
        aria-labelledby="off-licence-heading"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider"
                style={{ backgroundColor: "#ede9fe", color: "#6d28d9" }}
              >
                🍷 Licensed Off-Licence
              </span>
              <h2
                id="off-licence-heading"
                className="mt-3 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl"
              >
                Wines, Spirits &amp; Cold Beers
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                Browse our curated selection of wines from around the world, premium spirits,
                craft beers, and chilled lagers. Click &amp; collect from our Hayes store or
                get home delivery within 5 miles.
              </p>

              {/* Challenge 25 Notice */}
              <div
                className="mt-5 flex gap-3 rounded-xl p-4"
                style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}
              >
                <span className="text-2xl flex-shrink-0">🪪</span>
                <div>
                  <div className="text-sm font-black text-red-800">Challenge 25 Policy</div>
                  <div className="mt-0.5 text-xs text-red-700">
                    We operate a strict Challenge 25 policy. All customers who appear under 25
                    will be asked to show valid photo ID (passport, driving licence, or PASS card)
                    before alcohol is handed over.
                  </div>
                </div>
              </div>

              <Link
                href="/category/off-licence-beverages"
                className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black text-white shadow-sm transition-all hover:opacity-90"
                style={{ backgroundColor: "#7c3aed" }}
              >
                Shop Off-Licence →
              </Link>
            </div>

            {/* Right — categories grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { emoji: "🍾", label: "Champagne & Sparkling" },
                { emoji: "🍷", label: "Red & White Wines" },
                { emoji: "🥃", label: "Whisky & Spirits" },
                { emoji: "🍺", label: "Beer, Lager & Ale" },
                { emoji: "🍸", label: "Gin & Cocktail Mixers" },
                { emoji: "🥂", label: "Rosé & Prosecco" },
              ].map(({ emoji, label }) => (
                <Link
                  key={label}
                  href="/category/off-licence-beverages"
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 transition-all hover:scale-105 hover:shadow-sm"
                  style={{ backgroundColor: "white", border: "1px solid #e9d5ff" }}
                >
                  <span className="text-xl">{emoji}</span>
                  <span className="text-sm font-medium text-gray-800 leading-tight">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          8. DELIVERY ZONE INFO
      ═══════════════════════════════════════════════════ */}
      <section className="border-b border-gray-200 bg-white py-10 sm:py-14" aria-labelledby="delivery-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Store info card */}
            <div
              className="sm:col-span-2 rounded-2xl p-6 text-white"
              style={{ background: "linear-gradient(135deg, #111111 0%, #1a2a1a 100%)" }}
            >
              <div className="text-3xl mb-3">🏪</div>
              <h2 id="delivery-heading" className="text-xl font-black tracking-tight">
                Visit or Order Online
              </h2>
              <p className="mt-1 text-sm" style={{ color: "#9ca3af" }}>
                Your neighbourhood supermarket &amp; off-licence in Hayes
              </p>
              <div className="mt-4 space-y-1.5 text-sm" style={{ color: "#d1d5db" }}>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">📍</span> 147 North Hyde Road, Hayes UB3 4NS
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">📞</span> 0208 848 4840
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">🕐</span> Monday – Sunday: 7:00am – 10:00pm
                </div>
              </div>
              <Link
                href="/contact"
                className="mt-4 inline-flex items-center gap-1 rounded-lg border border-white/20 px-4 py-2 text-xs font-bold text-white hover:bg-white/10 transition-colors"
              >
                Get Directions →
              </Link>
            </div>

            {/* Delivery tier cards */}
            {[
              {
                zone: "Within 1 Mile",
                fee: "Free over £25",
                sub: "Otherwise £2.49",
                bg: "#f0fdf4",
                border: "#bbf7d0",
                badge: "🏃 Fastest",
                badgeBg: "#16a34a",
              },
              {
                zone: "1 – 3 Miles",
                fee: "£3.99",
                sub: "Covers Southall & Uxbridge",
                bg: "#fffbeb",
                border: "#fde68a",
                badge: "📦 Standard",
                badgeBg: "#d97706",
              },
              {
                zone: "3 – 5 Miles",
                fee: "£4.99",
                sub: "Max range delivered",
                bg: "#fef3c7",
                border: "#fcd34d",
                badge: "🚚 Extended",
                badgeBg: "#b45309",
              },
            ].map(({ zone, fee, sub, bg, border, badge, badgeBg }) => (
              <div
                key={zone}
                className="rounded-2xl p-5"
                style={{ backgroundColor: bg, border: `1px solid ${border}` }}
              >
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-black text-white"
                  style={{ backgroundColor: badgeBg }}
                >
                  {badge}
                </span>
                <div className="mt-3 text-base font-black text-gray-900">{zone}</div>
                <div className="mt-1 text-2xl font-black" style={{ color: badgeBg }}>{fee}</div>
                <div className="mt-0.5 text-xs text-gray-500">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          9. TRUST BADGES
      ═══════════════════════════════════════════════════ */}
      <section className="bg-white py-8" aria-labelledby="trust-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 id="trust-heading" className="sr-only">Why shop with SIRAGRO</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              {
                icon: "🔒",
                title: "Secure Payments",
                sub: "Processed by Stripe",
                bg: "#f0f9ff",
                color: "#0369a1",
              },
              {
                icon: "🌱",
                title: "Fresh Daily",
                sub: "Produce arrives every morning",
                bg: "#f0fdf4",
                color: "#15803d",
              },
              {
                icon: "🏆",
                title: "Local Business",
                sub: "Hayes based since 2010",
                bg: "#fefce8",
                color: "#a16207",
              },
              {
                icon: "🪪",
                title: "Licensed Retailer",
                sub: "Challenge 25 enforced",
                bg: "#fef2f2",
                color: "#b91c1c",
              },
            ].map(({ icon, title, sub, bg, color }) => (
              <div
                key={title}
                className="flex flex-col items-center rounded-2xl p-5 text-center"
                style={{ backgroundColor: bg }}
              >
                <span className="text-3xl">{icon}</span>
                <div className="mt-2 text-sm font-black" style={{ color }}>
                  {title}
                </div>
                <div className="mt-0.5 text-xs text-gray-500">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

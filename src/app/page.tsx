import Link from "next/link";
import { getCategories, getProducts } from "@/lib/products";
import { ProductCard } from "@/components/products/ProductCard";

/** Per-category vibrant tile colours */
const CAT_STYLES: Record<string, { bg: string; icon: string; ring: string }> = {
  "fresh-produce":         { bg: "linear-gradient(135deg,#16a34a,#15803d)", icon: "🥦", ring: "#16a34a" },
  "dairy-eggs":            { bg: "linear-gradient(135deg,#0284c7,#0369a1)", icon: "🥛", ring: "#0284c7" },
  "bakery":                { bg: "linear-gradient(135deg,#d97706,#b45309)", icon: "🍞", ring: "#d97706" },
  "meat-fish":             { bg: "linear-gradient(135deg,#dc2626,#b91c1c)", icon: "🥩", ring: "#dc2626" },
  "off-licence-beverages": { bg: "linear-gradient(135deg,#7c3aed,#6d28d9)", icon: "🍷", ring: "#7c3aed" },
  "cupboard-groceries":    { bg: "linear-gradient(135deg,#ea580c,#c2410c)", icon: "🥫", ring: "#ea580c" },
  "frozen-goods":          { bg: "linear-gradient(135deg,#0891b2,#0e7490)", icon: "❄️", ring: "#0891b2" },
  "household-cleaning":    { bg: "linear-gradient(135deg,#059669,#047857)", icon: "🧼", ring: "#059669" },
};

export default async function HomePage() {
  const [categories, { products }] = await Promise.all([
    getCategories(),
    getProducts({ limit: 8 }),
  ]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f3f8f4" }}>

      {/* ═══════════════════════════════════════════════════
          1. HERO — Signboard teal gradient, vibrant & bold
      ═══════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f2419 0%, #1a3d2b 40%, #245c3f 70%, #1a3d2b 100%)" }}
        aria-labelledby="hero-heading"
      >
        {/* Decorative radial glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-0 h-72 w-72 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #22c55e, transparent)" }} />
          <div className="absolute -right-10 bottom-0 h-64 w-64 rounded-full opacity-15" style={{ background: "radial-gradient(circle, #f59e0b, transparent)" }} />
          <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-5" style={{ background: "radial-gradient(circle, #ffffff, transparent)" }} />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">

            {/* Left — text */}
            <div>
              {/* Location badge */}
              <span
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-wider"
                style={{ background: "rgba(34,197,94,0.15)", color: "#6ee7b7", border: "1.5px solid rgba(34,197,94,0.3)" }}
              >
                📍 SIRAGRO · Hayes, UB3 4NS
              </span>

              {/* Headline */}
              <h1
                id="hero-heading"
                className="mt-5 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl xl:text-6xl"
              >
                SIRAGRO{" "}
                <span style={{ color: "#6ee7b7" }}>—</span>
                <span className="block" style={{ color: "#22c55e" }}>
                  Your Local
                </span>
                <span className="block text-white">
                  Supermarket
                </span>
              </h1>

              {/* Tagline strip */}
              <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold" style={{ color: "#a7f3d0" }}>
                {["Off Licence", "Grocery", "Fresh Fruits", "Vegetables", "Dairy", "Frozen Foods"].map((t) => (
                  <span
                    key={t}
                    className="rounded-md px-2 py-0.5"
                    style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)" }}
                  >
                    {t}
                  </span>
                ))}
              </div>

              <p className="mt-5 text-base leading-relaxed sm:text-lg" style={{ color: "#9ca3af" }}>
                Fresh groceries, chilled wines &amp; spirits, bakery, dairy and
                household essentials — all online. Order by&nbsp;6pm for same-day
                local delivery.
              </p>

              {/* Feature pills */}
              <div className="mt-5 flex flex-wrap gap-3">
                {[
                  { icon: "🚚", text: "Free delivery over £25" },
                  { icon: "🕐", text: "Open 7am – 10pm" },
                  { icon: "🏪", text: "Free collection always" },
                  { icon: "🍷", text: "Licensed off-licence" },
                ].map(({ icon, text }) => (
                  <span
                    key={text}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" }}
                  >
                    {icon} {text}
                  </span>
                ))}
              </div>

              {/* CTA buttons */}
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/shop"
                  className="btn-pulse rounded-2xl px-8 py-4 text-sm font-black text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl active:scale-95"
                  style={{ background: "linear-gradient(135deg, #16a34a, #22c55e)", boxShadow: "0 4px 20px rgba(34,197,94,0.4)" }}
                >
                  🛒 Shop Now
                </Link>
                <Link
                  href="/delivery-info"
                  className="rounded-2xl border-2 px-8 py-4 text-sm font-bold text-white transition-all hover:bg-white/10 active:scale-95"
                  style={{ borderColor: "rgba(255,255,255,0.3)" }}
                >
                  Delivery Info
                </Link>
              </div>
            </div>

            {/* Right — in-store services card */}
            <div className="hidden lg:block">
              <div
                className="rounded-3xl p-7"
                style={{ background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)" }}
              >
                <p className="mb-5 text-xs font-black uppercase tracking-widest" style={{ color: "#6ee7b7" }}>
                  Also Available In-Store
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { emoji: "🅿️", name: "PayPoint",        sub: "Pay bills & top up",    color: "#0284c7" },
                    { emoji: "🎱", name: "National Lottery", sub: "Lotto & scratch cards",  color: "#dc2626" },
                    { emoji: "💸", name: "Ria Money Transfer",sub: "Send money worldwide", color: "#f59e0b" },
                    { emoji: "🔑", name: "KeyNest",          sub: "Key exchange hub",       color: "#16a34a" },
                    { emoji: "📱", name: "Phone Repair",     sub: "Same-day service",       color: "#7c3aed" },
                    { emoji: "🍷", name: "Off-Licence",      sub: "Wines, spirits & beer",  color: "#b91c1c" },
                  ].map(({ emoji, name, sub, color }) => (
                    <div
                      key={name}
                      className="flex items-start gap-3 rounded-2xl p-3.5 transition-all hover:scale-[1.02]"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      <span
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-lg"
                        style={{ background: `${color}25` }}
                      >
                        {emoji}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-white">{name}</p>
                        <p className="text-[10px]" style={{ color: "#9ca3af" }}>{sub}</p>
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
          2. DELIVERY PERKS BAR
      ═══════════════════════════════════════════════════ */}
      <div style={{ background: "linear-gradient(90deg, #16a34a 0%, #15803d 50%, #16a34a 100%)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-px md:grid-cols-4" style={{ background: "rgba(255,255,255,0.1)" }}>
            {[
              { icon: "🚚", title: "Free Delivery", sub: "On orders over £25 (1 mile)" },
              { icon: "📍", title: "5-Mile Radius",  sub: "Covering UB3 & surrounds" },
              { icon: "🕐", title: "7am – 10pm",     sub: "Open every day" },
              { icon: "🏪", title: "Click & Collect", sub: "Always free, in-store" },
            ].map(({ icon, title, sub }) => (
              <div
                key={title}
                className="flex items-center gap-3 px-6 py-4 text-white"
                style={{ background: "rgba(21,128,61,0.6)" }}
              >
                <span className="text-2xl">{icon}</span>
                <div>
                  <p className="text-sm font-black">{title}</p>
                  <p className="text-[11px] opacity-80">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          3. SHOP BY CATEGORY — Vibrant coloured tiles
      ═══════════════════════════════════════════════════ */}
      <section className="py-12" aria-labelledby="categories-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 id="categories-heading" className="text-2xl font-black tracking-tight" style={{ color: "#1a3d2b" }}>
                Shop by Category
              </h2>
              <p className="text-sm" style={{ color: "#4b5563" }}>Everything you need, all in one place</p>
            </div>
            <Link
              href="/shop"
              className="rounded-xl px-5 py-2 text-sm font-bold text-white transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #1a3d2b, #245c3f)" }}
            >
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8">
            {categories.map((cat) => {
              const style = CAT_STYLES[cat.slug] ?? { bg: "linear-gradient(135deg,#16a34a,#15803d)", icon: "🛒", ring: "#16a34a" };
              return (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="group flex flex-col items-center gap-3 rounded-2xl p-4 text-center transition-all hover:scale-105 hover:shadow-lg"
                  style={{ background: "white", border: `2px solid transparent`, boxShadow: "0 2px 8px rgba(26,61,43,0.08)" }}
                >
                  <span
                    className="flex h-14 w-14 items-center justify-center rounded-full text-2xl transition-transform group-hover:scale-110 shadow-md"
                    style={{ background: style.bg }}
                  >
                    {style.icon}
                  </span>
                  <span className="text-xs font-bold leading-tight text-gray-700 group-hover:text-gray-900">
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          4. PROMO BANNER STRIP — 3 colourful cards
      ═══════════════════════════════════════════════════ */}
      <section className="pb-12" aria-label="Promotions">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

            {/* Card 1 — Fresh Deals (green) */}
            <Link
              href="/shop"
              className="group relative overflow-hidden rounded-3xl p-7 text-white transition-all hover:scale-[1.02] hover:shadow-2xl"
              style={{ background: "linear-gradient(135deg, #15803d 0%, #16a34a 60%, #22c55e 100%)" }}
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20" style={{ background: "rgba(255,255,255,0.4)" }} />
              <span className="shimmer inline-block rounded-full px-3 py-1 text-xs font-black text-white mb-3" style={{ background: "#f59e0b" }}>
                🔥 HOT DEALS
              </span>
              <h3 className="text-2xl font-black leading-tight">Fresh &amp; Grocery<br />Deals</h3>
              <p className="mt-2 text-sm opacity-85">Save big on fresh fruit, veg, bakery &amp; more</p>
              <span className="mt-4 inline-flex items-center gap-1 rounded-xl bg-white/20 px-4 py-2 text-sm font-bold group-hover:bg-white/30 transition-all">
                Shop Now →
              </span>
            </Link>

            {/* Card 2 — Off-Licence (purple/red) */}
            <Link
              href="/category/off-licence-beverages"
              className="group relative overflow-hidden rounded-3xl p-7 text-white transition-all hover:scale-[1.02] hover:shadow-2xl"
              style={{ background: "linear-gradient(135deg, #6d28d9 0%, #7c3aed 50%, #9333ea 100%)" }}
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20" style={{ background: "rgba(255,255,255,0.4)" }} />
              <span className="inline-block rounded-full px-3 py-1 text-xs font-black text-white mb-3" style={{ background: "#b91c1c" }}>
                🍷 OFF-LICENCE
              </span>
              <h3 className="text-2xl font-black leading-tight">Wines, Spirits<br />&amp; Cold Beers</h3>
              <p className="mt-2 text-sm opacity-85">Premium selection — age verification required</p>
              <span className="mt-4 inline-flex items-center gap-1 rounded-xl bg-white/20 px-4 py-2 text-sm font-bold group-hover:bg-white/30 transition-all">
                Browse →
              </span>
            </Link>

            {/* Card 3 — In-store services (amber) */}
            <div
              className="relative overflow-hidden rounded-3xl p-7 text-white"
              style={{ background: "linear-gradient(135deg, #b45309 0%, #d97706 50%, #f59e0b 100%)" }}
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20" style={{ background: "rgba(255,255,255,0.4)" }} />
              <span className="inline-block rounded-full px-3 py-1 text-xs font-black text-white mb-3" style={{ background: "#1a3d2b" }}>
                🏪 IN-STORE
              </span>
              <h3 className="text-2xl font-black leading-tight">More Services<br />In-Store</h3>
              <div className="mt-3 grid grid-cols-2 gap-1.5 text-xs font-semibold">
                {["PayPoint", "National Lottery", "Ria Money Transfer", "KeyNest", "Phone Repair"].map((s) => (
                  <span key={s} className="rounded-lg bg-white/20 px-2 py-1">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          5. FEATURED PRODUCTS
      ═══════════════════════════════════════════════════ */}
      <section className="py-12" style={{ background: "#fff" }} aria-labelledby="products-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 id="products-heading" className="text-2xl font-black tracking-tight" style={{ color: "#1a3d2b" }}>
                Featured Products
              </h2>
              <p className="text-sm" style={{ color: "#4b5563" }}>Handpicked deals from every aisle</p>
            </div>
            <Link
              href="/shop"
              className="rounded-xl px-5 py-2 text-sm font-bold text-white transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #16a34a, #22c55e)" }}
            >
              View All →
            </Link>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div
              className="rounded-3xl py-16 text-center"
              style={{ background: "#f3f8f4", border: "2px dashed #bbf7d0" }}
            >
              <span className="text-5xl">🛒</span>
              <p className="mt-4 font-bold" style={{ color: "#1a3d2b" }}>Products loading…</p>
              <p className="text-sm" style={{ color: "#6b7280" }}>Connect Supabase to see live products</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          6. IN-STORE SERVICES STRIP
      ═══════════════════════════════════════════════════ */}
      <section className="py-10" style={{ background: "linear-gradient(135deg, #1a3d2b, #245c3f)" }} aria-label="In-store services">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-7 text-center text-xl font-black text-white">Also Available In-Store</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {[
              { emoji: "🅿️", name: "PayPoint",         sub: "Bills & top-ups",        color: "#0284c7" },
              { emoji: "🎱", name: "National Lottery",  sub: "Lotto & scratch cards",  color: "#dc2626" },
              { emoji: "💸", name: "Ria Money Transfer",sub: "Send money worldwide",   color: "#f59e0b" },
              { emoji: "🔑", name: "KeyNest",           sub: "Key exchange",           color: "#22c55e" },
              { emoji: "📱", name: "Phone Repair",      sub: "Same-day service",       color: "#a78bfa" },
            ].map(({ emoji, name, sub, color }) => (
              <div
                key={name}
                className="flex flex-col items-center gap-3 rounded-2xl p-5 text-center transition-all hover:scale-105"
                style={{ background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(255,255,255,0.12)" }}
              >
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-lg"
                  style={{ background: `${color}30` }}
                >
                  {emoji}
                </span>
                <div>
                  <p className="text-sm font-black text-white">{name}</p>
                  <p className="text-[11px]" style={{ color: "#6ee7b7" }}>{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          7. DELIVERY ZONES TABLE
      ═══════════════════════════════════════════════════ */}
      <section className="py-12" style={{ background: "#f3f8f4" }} aria-labelledby="delivery-heading">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 id="delivery-heading" className="mb-2 text-center text-2xl font-black" style={{ color: "#1a3d2b" }}>
            Delivery Zones
          </h2>
          <p className="mb-8 text-center text-sm" style={{ color: "#4b5563" }}>
            Covering Hayes, Southall, Heston, Cranford &amp; surrounding areas
          </p>
          <div className="overflow-hidden rounded-3xl shadow-lg" style={{ border: "2px solid #bbf7d0" }}>
            <div className="grid grid-cols-4 text-xs font-black uppercase tracking-wider text-white" style={{ background: "linear-gradient(90deg, #1a3d2b, #245c3f)" }}>
              <div className="px-5 py-4">Zone</div>
              <div className="px-5 py-4">Distance</div>
              <div className="px-5 py-4">Delivery Fee</div>
              <div className="px-5 py-4">Min. Order</div>
            </div>
            {[
              { zone: "⚡ Express",   dist: "Up to 1 mile", fee: "FREE",           min: "£25",        bg: "#f0fdf4", accent: "#16a34a" },
              { zone: "🚚 Standard",  dist: "1 – 3 miles",  fee: "£3.99",          min: "£15",        bg: "#fff",    accent: "#0284c7" },
              { zone: "🗺️ Extended",  dist: "3 – 5 miles",  fee: "£4.99",          min: "£20",        bg: "#f0fdf4", accent: "#d97706" },
              { zone: "🏪 Collect",   dist: "Any distance", fee: "FREE",           min: "No minimum", bg: "#fff",    accent: "#7c3aed" },
            ].map(({ zone, dist, fee, min, bg, accent }) => (
              <div key={zone} className="grid grid-cols-4 items-center border-t text-sm" style={{ background: bg, borderColor: "#d1fae5" }}>
                <div className="px-5 py-4 font-black" style={{ color: accent }}>{zone}</div>
                <div className="px-5 py-4 text-gray-700">{dist}</div>
                <div className="px-5 py-4 font-black" style={{ color: fee === "FREE" ? "#16a34a" : "#1a3d2b" }}>{fee}</div>
                <div className="px-5 py-4 text-gray-600">{min}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs" style={{ color: "#6b7280" }}>
            * Delivery eligibility verified at checkout by postcode. Orders placed before 6pm qualify for same-day delivery.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          8. OFF-LICENCE FEATURE
      ═══════════════════════════════════════════════════ */}
      <section
        className="py-14"
        style={{ background: "linear-gradient(135deg, #3b0764 0%, #6d28d9 50%, #7c3aed 100%)" }}
        aria-labelledby="off-licence-heading"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-black text-white mb-4" style={{ background: "#b91c1c" }}>
                🍷 OFF-LICENCE · AGE 18+
              </span>
              <h2 id="off-licence-heading" className="text-3xl font-black leading-tight text-white sm:text-4xl">
                Wines, Spirits<br />&amp; Cold Beers
              </h2>
              <p className="mt-4 text-base leading-relaxed" style={{ color: "#c4b5fd" }}>
                Browse our curated selection of wines from around the world, premium spirits,
                craft beers and chilled lagers. Click &amp; collect from our SIRAGRO store or
                get home delivery within 5 miles.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-white" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>
                🪪 Challenge 25 policy enforced — please have valid ID ready
              </div>
              <div className="mt-6">
                <Link
                  href="/category/off-licence-beverages"
                  className="inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-black text-white shadow-xl transition-all hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #b91c1c, #dc2626)" }}
                >
                  🍷 Browse Off-Licence
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { emoji: "🍷", label: "Red Wine" },
                { emoji: "🥂", label: "Prosecco" },
                { emoji: "🥃", label: "Whisky" },
                { emoji: "🍺", label: "Cold Beer" },
                { emoji: "🍾", label: "Champagne" },
                { emoji: "🫚", label: "Spirits" },
              ].map(({ emoji, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-2 rounded-2xl p-4 text-center transition-all hover:scale-105"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  <span className="text-3xl">{emoji}</span>
                  <span className="text-xs font-bold text-white">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          9. TRUST BADGES
      ═══════════════════════════════════════════════════ */}
      <section className="py-12" style={{ background: "#fff" }} aria-label="Trust and security">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {[
              { emoji: "🔒", title: "Secure Payments",  sub: "Powered by Stripe",        color: "#0284c7", bg: "#e0f2fe" },
              { emoji: "🪪", title: "Challenge 25",      sub: "Age verification enforced", color: "#b91c1c", bg: "#fee2e2" },
              { emoji: "🏆", title: "Local Business",    sub: "SIRAGRO — Est. 2010",       color: "#d97706", bg: "#fef3c7" },
              { emoji: "🚚", title: "Fast Delivery",     sub: "Same-day within 5 miles",  color: "#16a34a", bg: "#dcfce7" },
            ].map(({ emoji, title, sub, color, bg }) => (
              <div
                key={title}
                className="flex flex-col items-center gap-3 rounded-3xl p-6 text-center transition-all hover:scale-[1.03] hover:shadow-md"
                style={{ background: bg, border: `2px solid ${color}30` }}
              >
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
                  style={{ background: `${color}20` }}
                >
                  {emoji}
                </span>
                <div>
                  <p className="font-black" style={{ color }}>{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          10. STORE INFO FOOTER BAND
      ═══════════════════════════════════════════════════ */}
      <section
        className="py-10"
        style={{ background: "linear-gradient(135deg, #0f2419, #1a3d2b)" }}
        aria-label="Store information"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <h3 className="mb-3 text-lg font-black text-white">📍 Visit Us</h3>
              <p className="text-sm" style={{ color: "#a7f3d0" }}>
                147 North Hyde Road<br />Hayes, Middlesex<br />UB3 4NS
              </p>
            </div>
            <div>
              <h3 className="mb-3 text-lg font-black text-white">📞 Contact</h3>
              <p className="text-sm" style={{ color: "#a7f3d0" }}>0208 848 4840</p>
              <p className="mt-2 text-sm font-bold" style={{ color: "#6ee7b7" }}>Open 7 days a week<br />7am – 10pm</p>
            </div>
            <div>
              <h3 className="mb-3 text-lg font-black text-white">🛒 Order Online</h3>
              <div className="flex flex-col gap-2">
                <Link href="/shop" className="text-sm font-bold transition-colors hover:text-white" style={{ color: "#6ee7b7" }}>
                  → Browse All Products
                </Link>
                <Link href="/delivery-info" className="text-sm font-bold transition-colors hover:text-white" style={{ color: "#6ee7b7" }}>
                  → Delivery Information
                </Link>
                <Link href="/register" className="text-sm font-bold transition-colors hover:text-white" style={{ color: "#6ee7b7" }}>
                  → Create Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

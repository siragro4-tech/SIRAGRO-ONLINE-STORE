import Link from "next/link";
import { getCategories, getProducts } from "@/lib/products";
import { ProductCard } from "@/components/products/ProductCard";

/** Category style config matching storefront departments */
const CAT_STYLES: Record<string, { icon: string; tag: string }> = {
  "fresh-produce":         { icon: "🥦", tag: "Fresh Fruits & Veg" },
  "dairy-eggs":            { icon: "🥛", tag: "Dairy & Chilled" },
  "bakery":                { icon: "🍞", tag: "Bakery & Bread" },
  "meat-fish":             { icon: "🥩", tag: "Meat & Poultry" },
  "off-licence-beverages": { icon: "🍷", tag: "Wines, Beers & Spirits" },
  "cupboard-groceries":    { icon: "🥫", tag: "Pantry & Groceries" },
  "frozen-goods":          { icon: "❄️", tag: "Frozen Foods" },
  "household-cleaning":    { icon: "🧼", tag: "Cleaning & Care" },
};

export default async function HomePage() {
  const [categories, { products }] = await Promise.all([
    getCategories(),
    getProducts({ limit: 8 }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* ═══════════════════════════════════════════════════
          1. HERO — Authentic Storefront Fascia Slate Navy (#1e293b)
      ═══════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden bg-[#1e293b] text-white border-b border-slate-700"
        aria-labelledby="hero-heading"
      >
        {/* Subtle high-street storefront texture overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/60 to-slate-950/80 pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">

            {/* Left 7 cols — Headline and details */}
            <div className="lg:col-span-7">
              {/* Physical store badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-800/90 border border-slate-600 px-3.5 py-1 text-xs font-semibold text-slate-200">
                <span className="text-emerald-400">📍</span>
                <span>147 North Hyde Road, Hayes UB3 4NS</span>
                <span className="text-slate-500">•</span>
                <span className="text-amber-400 font-bold">020 8813 6458</span>
              </div>

              {/* Fascia 3D Wordmark */}
              <h1
                id="hero-heading"
                className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none text-white"
              >
                <span className="fascia-3d-text block text-5xl sm:text-6xl lg:text-7xl">
                  SIRAGRO
                </span>
                <span className="mt-2 block text-xl sm:text-2xl font-bold tracking-normal text-emerald-400">
                  Supermarket &amp; Licensed Off-Licence
                </span>
              </h1>

              {/* Exact Fascia Departments Sub-Bar */}
              <div className="mt-4 flex flex-wrap gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-300">
                {[
                  "OFF LICENCE",
                  "GROCERY",
                  "FRESH FRUITS",
                  "FRESH VEGETABLES",
                  "DAIRY PRODUCTS",
                  "FROZEN FOODS",
                ].map((dept) => (
                  <span
                    key={dept}
                    className="rounded bg-slate-800/80 border border-slate-700/80 px-2 py-1 tracking-wider"
                  >
                    {dept}
                  </span>
                ))}
              </div>

              <p className="mt-4 text-base text-slate-300 max-w-xl leading-relaxed">
                Order your fresh daily groceries, chilled drinks, and supermarket essentials online
                for same-day local delivery across Hayes &amp; UB3 (up to 5 miles), or pick up in-store anytime.
              </p>

              {/* Perks pills */}
              <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium text-slate-200">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-950/70 border border-emerald-700/60 px-3 py-1 text-emerald-300">
                  🚚 Free Delivery over £25 (1 mile)
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-800 border border-slate-700 px-3 py-1">
                  🕐 Open 7am – 10pm Daily
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-800 border border-slate-700 px-3 py-1">
                  🏪 Free Click &amp; Collect
                </span>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/shop"
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-7 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:scale-105 active:scale-95"
                >
                  🛒 Shop Online Now
                </Link>
                <Link
                  href="/category/off-licence-beverages"
                  className="rounded-lg bg-red-700 hover:bg-red-600 px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:scale-105"
                >
                  🍷 Browse Off Licence
                </Link>
                <Link
                  href="/delivery-info"
                  className="rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 px-5 py-3.5 text-sm font-semibold text-slate-200 transition-colors"
                >
                  Delivery Zones
                </Link>
              </div>
            </div>

            {/* Right 5 cols — Store Services Card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-slate-900/90 border border-slate-700 p-6 shadow-2xl backdrop-blur-sm">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-wider text-white">
                      In-Store Counter Services
                    </h2>
                    <p className="text-xs text-slate-400">Available at 147 North Hyde Road</p>
                  </div>
                  <span className="rounded bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 uppercase">
                    Open 7 Days
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { icon: "🅿️", name: "PayPoint", desc: "Bills & energy top-up" },
                    { icon: "🎱", name: "National Lottery", desc: "Tickets & scratchcards" },
                    { icon: "💸", name: "Ria Money Transfer", desc: "Send money worldwide" },
                    { icon: "🔑", name: "KeyNest", desc: "Key collection point" },
                    { icon: "📱", name: "Phone Repair", desc: "Screen & battery fix" },
                    { icon: "🍷", name: "Off Licence", desc: "Chilled beers & spirits" },
                  ].map((srv) => (
                    <div
                      key={srv.name}
                      className="rounded-xl bg-slate-800/80 border border-slate-700/60 p-3 hover:bg-slate-800 transition-colors"
                    >
                      <div className="text-lg">{srv.icon}</div>
                      <p className="text-xs font-bold text-white mt-1">{srv.name}</p>
                      <p className="text-[10px] text-slate-400">{srv.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Tel: <strong className="text-white">020 8813 6458</strong></span>
                  <span>Postcode: <strong className="text-emerald-400">UB3 4NS</strong></span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          2. FAST DELIVERY BAR — Clean High-Street Bar
      ═══════════════════════════════════════════════════ */}
      <div className="bg-slate-900 text-slate-200 border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 text-lg">🚚</span>
              <div>
                <p className="font-bold text-white">Free Local Delivery</p>
                <p className="text-slate-400 text-[11px]">On orders over £25 within 1 mile</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 text-lg">📍</span>
              <div>
                <p className="font-bold text-white">5-Mile Radius</p>
                <p className="text-slate-400 text-[11px]">Hayes, Southall, Cranford &amp; UB3</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-lg">🏪</span>
              <div>
                <p className="font-bold text-white">Free Click &amp; Collect</p>
                <p className="text-slate-400 text-[11px]">Ready in 30 mins from store</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-400 text-lg">🪪</span>
              <div>
                <p className="font-bold text-white">Challenge 25 Verified</p>
                <p className="text-slate-400 text-[11px]">Strict ID on alcohol &amp; tobacco</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          3. SHOP BY DEPARTMENT — Clean Supermarket Grid
      ═══════════════════════════════════════════════════ */}
      <section className="py-10 bg-white border-b border-slate-200" aria-labelledby="dept-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 id="dept-heading" className="text-2xl font-black text-slate-900 tracking-tight">
                Shop by Department
              </h2>
              <p className="text-xs text-slate-500">Fresh daily stock sourced for your local pantry</p>
            </div>
            <Link
              href="/shop"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              View Full Catalogue &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {categories.map((cat) => {
              const meta = CAT_STYLES[cat.slug] || { icon: "🛒", tag: cat.name };
              return (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="group flex flex-col items-center p-3 rounded-xl border border-slate-200 hover:border-slate-800 hover:shadow-md transition-all text-center bg-slate-50 hover:bg-white"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white group-hover:bg-slate-100 shadow-sm border border-slate-200 text-2xl transition-transform group-hover:scale-110">
                    {meta.icon}
                  </div>
                  <span className="mt-2 text-xs font-bold text-slate-800 line-clamp-2 leading-tight">
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          4. PROMO HIGH-STREET CARDS (3-tier)
      ═══════════════════════════════════════════════════ */}
      <section className="py-10 bg-slate-100/70 border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Card 1 — Fresh Groceries */}
            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <span className="inline-block rounded bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 uppercase tracking-wider mb-2">
                  Daily Fresh
                </span>
                <h3 className="text-xl font-black text-slate-900">Fresh Fruits &amp; Vegetables</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Hand-selected crisp produce delivered fresh to our North Hyde Road store daily.
                </p>
              </div>
              <Link
                href="/category/fresh-produce"
                className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
              >
                Shop Fresh Produce &rarr;
              </Link>
            </div>

            {/* Card 2 — Licensed Off Licence */}
            <div className="rounded-2xl bg-[#1e293b] text-white p-6 shadow-md flex flex-col justify-between border border-slate-700">
              <div>
                <span className="inline-block rounded bg-red-600 text-white text-[10px] font-black px-2 py-0.5 uppercase tracking-wider mb-2">
                  Licensed Retailer
                </span>
                <h3 className="text-xl font-black text-white">Chilled Off Licence</h3>
                <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                  Wines, lagers, ciders, and premium spirits. Challenge 25 age verification enforced on delivery.
                </p>
              </div>
              <Link
                href="/category/off-licence-beverages"
                className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300"
              >
                Browse Wines &amp; Spirits &rarr;
              </Link>
            </div>

            {/* Card 3 — Free Pickup */}
            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <span className="inline-block rounded bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 uppercase tracking-wider mb-2">
                  Click &amp; Collect
                </span>
                <h3 className="text-xl font-black text-slate-900">Pick Up In 30 Minutes</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Place your order online and collect at our store counter with zero delivery fee.
                </p>
              </div>
              <Link
                href="/shop"
                className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-slate-800 hover:text-slate-950"
              >
                Start Your Basket &rarr;
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          5. FEATURED PRODUCTS
      ═══════════════════════════════════════════════════ */}
      <section className="py-12 bg-white" aria-labelledby="products-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 id="products-heading" className="text-2xl font-black text-slate-900 tracking-tight">
                Popular In Store
              </h2>
              <p className="text-xs text-slate-500">Everyday essentials ready for delivery or pickup</p>
            </div>
            <Link
              href="/shop"
              className="rounded-lg bg-[#1e293b] hover:bg-slate-700 text-white px-4 py-2 text-xs font-bold transition-colors"
            >
              Shop All Products &rarr;
            </Link>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
              <span className="text-4xl">🛒</span>
              <p className="mt-2 font-bold text-slate-700">Catalogue ready</p>
              <p className="text-xs text-slate-400">Loading products from live inventory</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          6. DELIVERY INFORMATION TABLE
      ═══════════════════════════════════════════════════ */}
      <section className="py-12 bg-slate-100 border-t border-slate-200" aria-labelledby="delivery-heading">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 id="delivery-heading" className="text-2xl font-black text-slate-900 tracking-tight">
              Local Delivery Coverage
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Dispatched directly from 147 North Hyde Road, Hayes UB3 4NS
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
            <div className="grid grid-cols-4 bg-[#1e293b] text-white text-xs font-bold py-3.5 px-4">
              <div>Zone</div>
              <div>Radius</div>
              <div>Delivery Fee</div>
              <div>Min Order</div>
            </div>
            {[
              { zone: "Zone 1 (Immediate)", dist: "Up to 1 mile", fee: "FREE over £25", min: "£15", note: "Otherwise £2.49" },
              { zone: "Zone 2 (Local)",     dist: "1 – 3 miles",  fee: "£3.99",          min: "£15", note: "Hayes, Southall, Cranford" },
              { zone: "Zone 3 (Extended)",  dist: "3 – 5 miles",  fee: "£4.99",          min: "£20", note: "Outer radius" },
              { zone: "Click & Collect",    dist: "In Store",     fee: "FREE Always",    min: "None", note: "147 North Hyde Road" },
            ].map((row, idx) => (
              <div
                key={row.zone}
                className={`grid grid-cols-4 items-center text-xs py-3.5 px-4 ${
                  idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                } border-t border-slate-200`}
              >
                <div className="font-bold text-slate-900">{row.zone}</div>
                <div className="text-slate-600">{row.dist}</div>
                <div className="font-bold text-emerald-700">{row.fee}</div>
                <div className="text-slate-500">{row.min}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-[11px] text-slate-500">
            Postcode verified at checkout using accurate road distance from UB3 4NS. Orders placed before 6pm qualify for same-day delivery.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          7. PHYSICAL STORE FOOTER BANNER
      ═══════════════════════════════════════════════════ */}
      <section className="bg-[#0f172a] text-slate-300 py-10 border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-white font-bold text-sm tracking-wider uppercase mb-2">
                📍 Physical Store Location
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong>SIRAGRO Supermarket &amp; Off-Licence</strong><br />
                147 North Hyde Road<br />
                Hayes, Middlesex<br />
                UB3 4NS
              </p>
            </div>
            <div>
              <h3 className="text-white font-bold text-sm tracking-wider uppercase mb-2">
                📞 Telephone &amp; Hours
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Telephone: <strong className="text-white">020 8813 6458</strong><br />
                Mobile / Line 2: <strong className="text-white">0208 848 4840</strong><br />
                Trading Hours: <span className="text-emerald-400 font-semibold">Monday – Sunday 7:00am – 10:00pm</span>
              </p>
            </div>
            <div>
              <h3 className="text-white font-bold text-sm tracking-wider uppercase mb-2">
                🛡️ Licencing &amp; Compliance
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Licensed under the Licensing Act 2003. Challenge 25 is strictly enforced for all age-restricted
                sales (alcohol, tobacco, lottery). Please ensure valid photo ID (passport, driving licence, PASS card)
                is presented upon delivery or collection.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

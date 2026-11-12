import Link from "next/link";
import { getCategories, getProducts } from "@/lib/products";
import { ProductCard } from "@/components/products/ProductCard";

const CAT_STYLES: Record<string, { icon: string; tag: string }> = {
  "fresh-produce":         { icon: "🥦", tag: "Fresh Fruits & Veg" },
  "dairy-eggs":            { icon: "🥛", tag: "Dairy Products" },
  "bakery":                { icon: "🍞", tag: "Fresh Bakery" },
  "meat-fish":             { icon: "🥩", tag: "Meat & Poultry" },
  "off-licence-beverages": { icon: "🍷", tag: "Off Licence & Beers" },
  "cupboard-groceries":    { icon: "🥫", tag: "Grocery & Cupboard" },
  "frozen-goods":          { icon: "❄️", tag: "Frozen Foods" },
  "household-cleaning":    { icon: "🧼", tag: "Household & Cleaning" },
};

export default async function HomePage() {
  const [categories, { products }] = await Promise.all([
    getCategories(),
    getProducts({ limit: 8 }),
  ]);

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#1e2530]">

      {/* ═══════════════════════════════════════════════════
          1. HERO — Prominent #323C4B & White Storefront
      ═══════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden bg-[#323C4B] text-white border-b-4 border-[#242c37]"
        aria-labelledby="hero-heading"
      >
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">

            {/* Left 7 cols: Fascia, Wordmark & Info */}
            <div className="lg:col-span-7">
              {/* Physical store badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-white text-[#323C4B] px-4 py-1.5 text-xs font-black uppercase tracking-wider shadow-sm">
                <span>📍</span>
                <span>147 North Hyde Road, Hayes UB3 4NS</span>
                <span>•</span>
                <span>020 8813 6458</span>
              </div>

              {/* Exact Fascia 3D Wordmark */}
              <h1
                id="hero-heading"
                className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none text-white"
              >
                <span className="fascia-3d-text block text-5xl sm:text-6xl lg:text-7xl">
                  SIRAGRO
                </span>
                <span className="mt-2 block text-xl sm:text-2xl font-bold tracking-normal text-white/95">
                  Supermarket &amp; Licensed Off-Licence
                </span>
              </h1>

              {/* Exact Departments Sub-Bar from Signboard */}
              <div className="mt-4 flex flex-wrap gap-1.5 text-[11px] sm:text-xs font-bold text-white">
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
                    className="rounded bg-[#242c37] border border-[#4a586d] px-2.5 py-1 tracking-wider text-white"
                  >
                    {dept}
                  </span>
                ))}
              </div>

              <p className="mt-5 text-base text-white/90 max-w-xl leading-relaxed font-normal">
                Order your fresh daily groceries, chilled wines &amp; beers, bakery and household
                essentials online. Fast local delivery across Hayes &amp; UB3 (up to 5 miles) or collect in-store free.
              </p>

              {/* Store Perks Pills */}
              <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white text-[#323C4B] px-3 py-1.5 shadow-sm">
                  🚚 Free Delivery over £25 (1 mile)
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#242c37] text-white border border-[#4a586d] px-3 py-1.5">
                  🕐 Open 7am – 10pm Daily
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#242c37] text-white border border-[#4a586d] px-3 py-1.5">
                  🏪 Free Click &amp; Collect
                </span>
              </div>

              {/* CTAs */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/shop"
                  className="rounded-lg bg-white text-[#323C4B] hover:bg-white/90 px-8 py-4 text-sm font-black shadow-lg transition-all hover:scale-105 active:scale-95"
                >
                  🛒 Shop Online Now
                </Link>
                <Link
                  href="/category/off-licence-beverages"
                  className="rounded-lg bg-[#242c37] hover:bg-[#1b2129] border-2 border-white text-white px-7 py-3.5 text-sm font-bold shadow-md transition-all hover:scale-105"
                >
                  🍷 Browse Off Licence
                </Link>
                <Link
                  href="/delivery-info"
                  className="rounded-lg bg-white/10 hover:bg-white/20 text-white px-5 py-3.5 text-sm font-semibold transition-colors"
                >
                  Delivery Info
                </Link>
              </div>
            </div>

            {/* Right 5 cols: Services Card in #242c37 & White */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-[#242c37] border-2 border-[#414e60] p-6 shadow-2xl text-white">
                <div className="flex items-center justify-between border-b border-[#3d495b] pb-3 mb-4">
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-wider text-white">
                      In-Store Counter Services
                    </h2>
                    <p className="text-xs text-white/70">147 North Hyde Road, Hayes UB3 4NS</p>
                  </div>
                  <span className="rounded bg-white text-[#323C4B] text-[10px] font-black px-2.5 py-1 uppercase">
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
                      className="rounded-xl bg-[#323C4B] border border-[#4a586d] p-3 hover:bg-[#3d495b] transition-colors"
                    >
                      <div className="text-xl">{srv.icon}</div>
                      <p className="text-xs font-bold text-white mt-1">{srv.name}</p>
                      <p className="text-[10px] text-white/70">{srv.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-[#3d495b] flex items-center justify-between text-xs text-white/80">
                  <span>Store Tel: <strong className="text-white">020 8813 6458</strong></span>
                  <span>Postcode: <strong className="text-white font-black">UB3 4NS</strong></span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          2. STOREFRONT PERKS BAR (#323C4B & White)
      ═══════════════════════════════════════════════════ */}
      <div className="bg-[#242c37] text-white border-b border-[#3d495b]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🚚</span>
              <div>
                <p className="font-bold text-white">Free Local Delivery</p>
                <p className="text-white/75 text-[11px]">Orders over £25 within 1 mile</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-xl">📍</span>
              <div>
                <p className="font-bold text-white">5-Mile Delivery Radius</p>
                <p className="text-white/75 text-[11px]">Hayes, Southall &amp; UB3 postcodes</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🏪</span>
              <div>
                <p className="font-bold text-white">Click &amp; Collect Free</p>
                <p className="text-white/75 text-[11px]">Ready in 30 mins in-store</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🪪</span>
              <div>
                <p className="font-bold text-white">Challenge 25 Verified</p>
                <p className="text-white/75 text-[11px]">Valid ID required on alcohol</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          3. SHOP BY DEPARTMENT (Clean White & #323C4B)
      ═══════════════════════════════════════════════════ */}
      <section className="py-10 bg-white border-b border-slate-200" aria-labelledby="dept-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 id="dept-heading" className="text-2xl font-black text-[#323C4B] tracking-tight">
                Shop by Department
              </h2>
              <p className="text-xs text-slate-500">Fresh daily stock sourced for your local pantry</p>
            </div>
            <Link
              href="/shop"
              className="text-xs font-black text-[#323C4B] hover:text-[#242c37] border-b-2 border-[#323C4B] pb-0.5 transition-colors"
            >
              View Full Catalogue &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3.5">
            {categories.map((cat) => {
              const meta = CAT_STYLES[cat.slug] || { icon: "🛒", tag: cat.name };
              return (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="group flex flex-col items-center p-3.5 rounded-xl border-2 border-slate-200 hover:border-[#323C4B] hover:shadow-lg transition-all text-center bg-[#f8fafc] hover:bg-white"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white group-hover:bg-[#323C4B] group-hover:text-white shadow-sm border border-slate-200 text-2xl transition-colors">
                    {meta.icon}
                  </div>
                  <span className="mt-2 text-xs font-bold text-[#323C4B] line-clamp-2 leading-tight">
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          4. PROMO STOREFRONT CARDS (Showcasing #323C4B)
      ═══════════════════════════════════════════════════ */}
      <section className="py-10 bg-[#edf1f5] border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Card 1: Fresh Produce */}
            <div className="rounded-2xl bg-white border-2 border-slate-200 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <span className="inline-block rounded bg-[#323C4B] text-white text-[10px] font-black px-2.5 py-1 uppercase tracking-wider mb-3">
                  Fresh Daily
                </span>
                <h3 className="text-xl font-black text-[#323C4B]">Fresh Fruits &amp; Vegetables</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Hand-selected produce delivered fresh every morning to our 147 North Hyde Road shop.
                </p>
              </div>
              <Link
                href="/category/fresh-produce"
                className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-[#323C4B] hover:underline"
              >
                Shop Fresh Produce &rarr;
              </Link>
            </div>

            {/* Card 2: Off Licence (#323C4B dominant) */}
            <div className="rounded-2xl bg-[#323C4B] text-white p-6 shadow-md flex flex-col justify-between border-2 border-[#242c37]">
              <div>
                <span className="inline-block rounded bg-white text-[#323C4B] text-[10px] font-black px-2.5 py-1 uppercase tracking-wider mb-3">
                  Licensed Off Licence
                </span>
                <h3 className="text-xl font-black text-white">Chilled Wines, Beers &amp; Spirits</h3>
                <p className="mt-2 text-xs text-white/80 leading-relaxed">
                  Top brands, chilled lagers, fine wines, and spirits. Delivered straight to your doorstep within 5 miles.
                </p>
              </div>
              <Link
                href="/category/off-licence-beverages"
                className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-white hover:underline"
              >
                Browse Off Licence &rarr;
              </Link>
            </div>

            {/* Card 3: Free Collection */}
            <div className="rounded-2xl bg-white border-2 border-slate-200 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <span className="inline-block rounded bg-[#323C4B] text-white text-[10px] font-black px-2.5 py-1 uppercase tracking-wider mb-3">
                  Click &amp; Collect
                </span>
                <h3 className="text-xl font-black text-[#323C4B]">Ready In 30 Minutes</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Skip the delivery wait. Order online and pick up at our shop counter with zero fee.
                </p>
              </div>
              <Link
                href="/shop"
                className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-[#323C4B] hover:underline"
              >
                Start Your Basket &rarr;
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          5. POPULAR IN STORE (Products Grid)
      ═══════════════════════════════════════════════════ */}
      <section className="py-12 bg-white" aria-labelledby="products-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 id="products-heading" className="text-2xl font-black text-[#323C4B] tracking-tight">
                Popular In Store
              </h2>
              <p className="text-xs text-slate-500">Everyday groceries and drinks ready for delivery or pickup</p>
            </div>
            <Link
              href="/shop"
              className="rounded-lg bg-[#323C4B] hover:bg-[#242c37] text-white px-5 py-2.5 text-xs font-bold shadow-sm transition-colors"
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
            <div className="rounded-2xl border-2 border-dashed border-[#323C4B]/20 p-12 text-center bg-[#f8fafc]">
              <span className="text-4xl">🛒</span>
              <p className="mt-2 font-bold text-[#323C4B]">Products ready</p>
              <p className="text-xs text-slate-500">Loading catalog from inventory</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          6. DELIVERY COVERAGE TABLE (With #323C4B Header)
      ═══════════════════════════════════════════════════ */}
      <section className="py-12 bg-[#edf1f5] border-t border-slate-200" aria-labelledby="delivery-heading">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 id="delivery-heading" className="text-2xl font-black text-[#323C4B] tracking-tight">
              Local Delivery Coverage
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Dispatched from 147 North Hyde Road, Hayes UB3 4NS
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border-2 border-[#323C4B] bg-white shadow-md">
            <div className="grid grid-cols-4 bg-[#323C4B] text-white text-xs font-bold py-3.5 px-4">
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
                  idx % 2 === 0 ? "bg-white" : "bg-[#f8fafc]"
                } border-t border-slate-200`}
              >
                <div className="font-bold text-[#323C4B]">{row.zone}</div>
                <div className="text-slate-600">{row.dist}</div>
                <div className="font-black text-[#323C4B]">{row.fee}</div>
                <div className="text-slate-600">{row.min}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-[11px] text-slate-500">
            Postcode verified at checkout using distance from UB3 4NS. Same-day delivery on orders before 6pm.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          7. PHYSICAL STORE LOCATION (#323C4B & White)
      ═══════════════════════════════════════════════════ */}
      <section className="bg-[#323C4B] text-white py-12 border-t border-[#242c37]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-xl bg-[#242c37] p-6 border border-[#4a586d]">
              <h3 className="text-white font-bold text-sm tracking-wider uppercase mb-2">
                📍 Store Location
              </h3>
              <p className="text-xs text-white/90 leading-relaxed">
                <strong className="text-white text-sm">SIRAGRO Supermarket &amp; Off-Licence</strong><br />
                147 North Hyde Road<br />
                Hayes, Middlesex<br />
                UB3 4NS
              </p>
            </div>
            <div className="rounded-xl bg-[#242c37] p-6 border border-[#4a586d]">
              <h3 className="text-white font-bold text-sm tracking-wider uppercase mb-2">
                📞 Telephone &amp; Hours
              </h3>
              <p className="text-xs text-white/90 leading-relaxed">
                Store Phone: <strong className="text-white">020 8813 6458</strong><br />
                Counter: <strong className="text-white">0208 848 4840</strong><br />
                Hours: <span className="text-white font-bold">Mon – Sun 7:00am – 10:00pm</span>
              </p>
            </div>
            <div className="rounded-xl bg-[#242c37] p-6 border border-[#4a586d]">
              <h3 className="text-white font-bold text-sm tracking-wider uppercase mb-2">
                🛡️ Licencing &amp; Challenge 25
              </h3>
              <p className="text-xs text-white/80 leading-relaxed">
                Licensed under Licensing Act 2003. Challenge 25 is strictly enforced for alcohol, tobacco and lottery.
                Valid photo ID is required upon delivery or collection.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

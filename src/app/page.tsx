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
    <div className="min-h-screen bg-[#f4f6f9] text-[#1e2530] overflow-x-hidden">

      {/* ═══════════════════════════════════════════════════
          1. CINEMATIC HERO SECTION
          - Sharp, high-visibility supermarket background image
          - Bold, inspiring headline: Fresh Choices. Everyday Essentials.
          - Shop Now & Explore Our Store action buttons
          - Crazy Spring entrance animation
      ═══════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden min-h-[480px] sm:min-h-[540px] flex items-center bg-[#1e2530] border-b-4 border-[#242c37]"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(36, 44, 55, 0.78) 0%, rgba(50, 60, 75, 0.60) 50%, rgba(50, 60, 75, 0.38) 100%), url('/images/hero-supermarket.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center 40%",
        }}
        aria-labelledby="hero-heading"
      >
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 w-full">
          <div className="max-w-3xl animate-pop-in">

            {/* Inspiring Brand Badge with float bobbing */}
            <div className="animate-crazy-float inline-flex items-center gap-2 rounded-full bg-white/95 text-[#323C4B] px-4 py-1.5 text-xs font-black uppercase tracking-wider shadow-2xl mb-4 border border-white">
              <span className="text-base">🏪</span>
              <span>SIRAGRO Supermarket &amp; Off-Licence</span>
            </div>

            {/* Bold Inspiring 3D Heading */}
            <h1
              id="hero-heading"
              className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-tight"
            >
              <span className="fascia-3d-text block drop-shadow-2xl">
                Fresh Choices.
              </span>
              <span className="fascia-3d-text block drop-shadow-2xl mt-1 text-white">
                Everyday Essentials.
              </span>
            </h1>

            {/* Inspiring Subtitle */}
            <p className="mt-5 text-lg sm:text-xl text-white font-medium leading-relaxed max-w-xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
              Your local supermarket for fresh groceries, everyday essentials and more. Shop with us today!
            </p>

            {/* Action Buttons: Shop Now & Explore Our Store */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/shop"
                className="crazy-card shimmer-btn rounded-2xl bg-white text-[#323C4B] hover:bg-white/95 px-8 py-4 text-base font-black shadow-2xl flex items-center gap-2.5 border-2 border-white"
              >
                <span className="crazy-icon text-xl">🛒</span>
                <span>Shop Now</span>
              </Link>
              <Link
                href="#dept-heading"
                className="crazy-card rounded-2xl bg-[#242c37]/90 hover:bg-[#242c37] border-2 border-white text-white px-7 py-3.5 text-base font-bold shadow-2xl backdrop-blur-sm flex items-center gap-2.5"
              >
                <span className="crazy-icon text-xl">🏬</span>
                <span>Explore Our Store</span>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          2. DEPARTMENTS GRID (Crazy animated scroll cards)
      ═══════════════════════════════════════════════════ */}
      <section id="dept-heading" className="py-14 bg-white border-b border-slate-200" aria-labelledby="dept-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8 scroll-pop">
            <div className="scroll-slide-left">
              <h2 id="dept-title" className="text-2xl sm:text-3xl font-black text-[#323C4B] tracking-tight">
                Shop by Department
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Everyday supermarket fresh stock</p>
            </div>
            <Link
              href="/shop"
              className="scroll-slide-right crazy-card text-xs sm:text-sm font-black text-[#323C4B] hover:text-[#242c37] border-b-2 border-[#323C4B] pb-0.5 inline-flex items-center gap-1"
            >
              <span>View All</span>
              <span className="crazy-icon">&rarr;</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {categories.map((cat, idx) => {
              const meta = CAT_STYLES[cat.slug] || { icon: "🛒", tag: cat.name };
              return (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="scroll-pop crazy-card group flex flex-col items-center p-4 rounded-2xl border-2 border-slate-200 text-center bg-[#f8fafc] hover:bg-white"
                  style={{ transitionDelay: `${idx * 40}ms` }}
                >
                  <div className="crazy-icon flex h-14 w-14 items-center justify-center rounded-2xl bg-white group-hover:bg-[#323C4B] group-hover:text-white shadow-sm border border-slate-200 text-2xl">
                    {meta.icon}
                  </div>
                  <span className="mt-3 text-xs font-bold text-[#323C4B] line-clamp-2 leading-tight">
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          3. POPULAR PRODUCTS (Crazy spring hover cards & icons)
      ═══════════════════════════════════════════════════ */}
      <section className="py-14 bg-[#f4f6f9]" aria-labelledby="products-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8 scroll-pop">
            <div className="scroll-slide-left">
              <h2 id="products-heading" className="text-2xl sm:text-3xl font-black text-[#323C4B] tracking-tight">
                Popular In Store
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Available for same-day delivery or collection</p>
            </div>
            <Link
              href="/shop"
              className="scroll-slide-right crazy-card rounded-xl bg-[#323C4B] hover:bg-[#242c37] text-white px-5 py-2.5 text-xs font-bold shadow-md inline-flex items-center gap-1.5"
            >
              <span>Explore Catalogue</span>
              <span className="crazy-icon">&rarr;</span>
            </Link>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product, idx) => (
                <div
                  key={product.id}
                  className="scroll-pop crazy-card rounded-2xl"
                  style={{ transitionDelay: `${idx * 50}ms` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border-2 border-dashed border-[#323C4B]/20 p-12 text-center bg-white scroll-pop">
              <span className="text-4xl animate-crazy-float inline-block">🛒</span>
              <p className="mt-3 font-bold text-[#323C4B]">Products ready</p>
              <p className="text-xs text-slate-500">Loading catalog from live inventory</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          4. IN-STORE COUNTER SERVICES (Crazy interactive animated cards)
      ═══════════════════════════════════════════════════ */}
      <section className="py-14 bg-[#323C4B] text-white border-y border-[#242c37]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10 scroll-pop">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              In-Store Services
            </h2>
            <p className="text-xs sm:text-sm text-white/80 mt-1">
              Convenient counter services at 147 North Hyde Road, Hayes
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: "🅿️", name: "PayPoint", desc: "Bills & energy" },
              { icon: "🎱", name: "National Lottery", desc: "Tickets & scratch" },
              { icon: "💸", name: "Ria Money", desc: "Global transfer" },
              { icon: "🔑", name: "KeyNest", desc: "Key exchange" },
              { icon: "📱", name: "Phone Repair", desc: "Screen fix" },
              { icon: "🍷", name: "Off Licence", desc: "Beers & spirits" },
            ].map((srv, idx) => (
              <div
                key={srv.name}
                className="scroll-pop crazy-card rounded-2xl bg-[#242c37] border border-[#4a586d] p-5 text-center flex flex-col items-center justify-center cursor-pointer"
                style={{ transitionDelay: `${idx * 40}ms` }}
              >
                <div className="crazy-icon text-3xl inline-block">{srv.icon}</div>
                <h3 className="text-sm font-bold text-white mt-2">{srv.name}</h3>
                <p className="text-[11px] text-white/70 mt-0.5">{srv.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          5. DELIVERY COVERAGE TABLE (Scroll-triggered popup)
      ═══════════════════════════════════════════════════ */}
      <section className="py-14 bg-white" aria-labelledby="delivery-heading">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 scroll-pop">
            <h2 id="delivery-heading" className="text-2xl sm:text-3xl font-black text-[#323C4B] tracking-tight">
              Local Delivery Coverage
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Dispatched from 147 North Hyde Road, Hayes UB3 4NS (up to 5 miles)
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border-2 border-[#323C4B] bg-white shadow-xl crazy-card scroll-pop">
            <div className="grid grid-cols-4 bg-[#323C4B] text-white text-xs sm:text-sm font-bold py-4 px-5">
              <div>Zone</div>
              <div>Radius</div>
              <div>Delivery Fee</div>
              <div>Min Order</div>
            </div>
            {[
              { zone: "Zone 1 (Immediate)", dist: "Up to 1 mile", fee: "FREE over £25", min: "£15" },
              { zone: "Zone 2 (Local)",     dist: "1 – 3 miles",  fee: "£3.99",          min: "£15" },
              { zone: "Zone 3 (Extended)",  dist: "3 – 5 miles",  fee: "£4.99",          min: "£20" },
              { zone: "Click & Collect",    dist: "In Store",     fee: "FREE Always",    min: "None" },
            ].map((row, idx) => (
              <div
                key={row.zone}
                className={`grid grid-cols-4 items-center text-xs sm:text-sm py-4 px-5 ${
                  idx % 2 === 0 ? "bg-white" : "bg-[#f8fafc]"
                } border-t border-slate-200 transition-colors hover:bg-slate-100`}
              >
                <div className="font-bold text-[#323C4B]">{row.zone}</div>
                <div className="text-slate-600">{row.dist}</div>
                <div className="font-black text-[#323C4B]">{row.fee}</div>
                <div className="text-slate-600">{row.min}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-slate-500">
            Postcode verified at checkout using distance from UB3 4NS. Same-day delivery on orders placed before 6pm.
          </p>
        </div>
      </section>

    </div>
  );
}

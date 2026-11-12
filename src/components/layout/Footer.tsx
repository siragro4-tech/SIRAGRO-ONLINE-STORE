import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0f172a] text-slate-300 border-t border-slate-800" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">SIRAGRO Footer</h2>

      {/* ── Main footer grid ── */}
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">

          {/* Col 1 — Brand (wider) */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 group">
              <Logo size={56} dark />
              <div className="text-white leading-tight">
                <div className="text-xl font-black tracking-widest uppercase">SIRAGRO</div>
                <div className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#4ade80" }}>
                  Supermarket &amp; Off-Licence
                </div>
              </div>
            </Link>

            <p className="mt-5 text-sm leading-relaxed text-slate-400">
              Your trusted local supermarket and licensed off-licence at 147 North Hyde Road, Hayes.
              Serving the UB3 community with fresh groceries, chilled drinks, bakery goods
              and in-store counter services.
            </p>

            {/* Contact info */}
            <div className="mt-5 space-y-2 text-sm text-slate-300">
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">📍</span>
                <span>147 North Hyde Road, Hayes,<br />Middlesex UB3 4NS</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">📞</span>
                <a href="tel:02088136458" className="hover:text-white transition-colors">020 8813 6458</a>
                <span className="text-slate-600">/</span>
                <a href="tel:02088484840" className="hover:text-white transition-colors">0208 848 4840</a>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">🕐</span>
                Monday – Sunday: 7:00am – 10:00pm
              </div>
            </div>

            {/* In-store services pills */}
            <div className="mt-5 flex flex-wrap gap-2">
              {["PayPoint", "National Lottery", "Ria Money Transfer", "KeyNest", "Phone Repair"].map((s) => (
                <span
                  key={s}
                  className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Col 2 — Shop aisles */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-white">
              Shop Aisles
            </h3>
            <ul className="mt-4 space-y-2.5">
              {[
                { href: "/shop",                        label: "All Products" },
                { href: "/category/fresh-produce",      label: "🥦 Fresh Produce" },
                { href: "/category/dairy-eggs",         label: "🥛 Dairy & Eggs" },
                { href: "/category/bakery",             label: "🍞 Bakery" },
                { href: "/category/meat-fish",          label: "🥩 Meat & Fish" },
                { href: "/category/off-licence-beverages", label: "🍷 Off-Licence" },
                { href: "/category/cupboard-groceries", label: "🥫 Cupboard & Groceries" },
                { href: "/category/frozen-goods",       label: "❄️ Frozen Goods" },
                { href: "/category/household-cleaning", label: "🧼 Household & Cleaning" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm transition-colors hover:text-white"
                    style={{ color: "#9ca3af" }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Help & Info */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-white">
              Help &amp; Info
            </h3>
            <ul className="mt-4 space-y-2.5">
              {[
                { href: "/about",         label: "About SIRAGRO" },
                { href: "/contact",       label: "Contact Us" },
                { href: "/delivery-info", label: "Delivery Information" },
                { href: "/account",       label: "My Account" },
                { href: "/account/orders/", label: "Order History" },
                { href: "/login",         label: "Sign In" },
                { href: "/register",      label: "Register" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm transition-colors hover:text-white"
                    style={{ color: "#9ca3af" }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Legal */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-white">
              Legal
            </h3>
            <ul className="mt-4 space-y-2.5">
              {[
                { href: "/privacy",  label: "Privacy Policy" },
                { href: "/terms",    label: "Terms & Conditions" },
                { href: "/cookies",  label: "Cookie Policy" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm transition-colors hover:text-white"
                    style={{ color: "#9ca3af" }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-white">
                Responsible Retail
              </h3>
              <div
                className="mt-3 rounded-xl p-3 text-xs leading-relaxed"
                style={{ backgroundColor: "rgba(185,28,28,0.15)", border: "1px solid rgba(185,28,28,0.3)", color: "#fca5a5" }}
              >
                <span className="font-black text-red-400">Challenge 25:</span> We operate
                a strict Challenge 25 policy on all off-licence purchases.
                Photo ID required for anyone who appears under 25.
                Licensing Act 2003.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div
        className="border-t"
        style={{ borderColor: "#2a2a2a", backgroundColor: "#080808" }}
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-xs" style={{ color: "#6b7280" }}>
            &copy; {currentYear} SIRAGRO Supermarket &amp; Off-Licence. All rights reserved.
            Registered in England &amp; Wales. 147 North Hyde Road, Hayes UB3 4NS.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs" style={{ color: "#6b7280" }}>
              Secure payments by
            </span>
            <span
              className="rounded px-2 py-0.5 text-xs font-black text-white"
              style={{ backgroundColor: "#635bff" }}
            >
              Stripe
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

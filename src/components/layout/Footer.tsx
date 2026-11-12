import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#242c37] text-white border-t-4 border-[#323C4B]" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">SIRAGRO Footer</h2>

      {/* Main footer grid */}
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">

          {/* Col 1 — Brand (wider) */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3.5 group">
              <Logo size={56} dark />
              <div className="text-white leading-tight">
                <div className="text-2xl font-black tracking-wider uppercase">SIRAGRO</div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-white/80">
                  Supermarket &amp; Off-Licence
                </div>
              </div>
            </Link>

            <p className="mt-4 text-sm leading-relaxed text-white/80">
              Your trusted local supermarket and licensed off-licence in Hayes, UB3.
              Fresh groceries, chilled beverages, pantry goods and friendly counter service.
            </p>
          </div>

          {/* Col 2 — Shop Aisles */}
          <div>
            <h3 className="text-sm font-black tracking-wider text-white uppercase">Shop Aisles</h3>
            <ul className="mt-4 space-y-2.5 text-xs text-white/80">
              <li><Link href="/category/fresh-produce" className="hover:text-white transition-colors">Fresh Fruits &amp; Veg</Link></li>
              <li><Link href="/category/dairy-eggs" className="hover:text-white transition-colors">Dairy &amp; Eggs</Link></li>
              <li><Link href="/category/bakery" className="hover:text-white transition-colors">Fresh Bakery</Link></li>
              <li><Link href="/category/meat-fish" className="hover:text-white transition-colors">Meat &amp; Fish</Link></li>
              <li><Link href="/category/off-licence-beverages" className="hover:text-white transition-colors font-bold text-white">Off-Licence &amp; Beers</Link></li>
              <li><Link href="/category/cupboard-groceries" className="hover:text-white transition-colors">Cupboard Groceries</Link></li>
              <li><Link href="/category/frozen-goods" className="hover:text-white transition-colors">Frozen Foods</Link></li>
              <li><Link href="/category/household-cleaning" className="hover:text-white transition-colors">Household Essentials</Link></li>
            </ul>
          </div>

          {/* Col 3 — Customer Care */}
          <div>
            <h3 className="text-sm font-black tracking-wider text-white uppercase">Customer Care</h3>
            <ul className="mt-4 space-y-2.5 text-xs text-white/80">
              <li><Link href="/delivery-info" className="hover:text-white transition-colors">Delivery Information</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us &amp; Map</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About SIRAGRO</Link></li>
              <li><Link href="/account" className="hover:text-white transition-colors">My Account</Link></li>
              <li><Link href="/basket" className="hover:text-white transition-colors">Shopping Basket</Link></li>
              <li><Link href="/admin" className="hover:text-white transition-colors text-white/60">Staff Admin Portal</Link></li>
            </ul>
          </div>

          {/* Col 4 — Legal & Licencing */}
          <div>
            <h3 className="text-sm font-black tracking-wider text-white uppercase">Legal &amp; Store</h3>
            <ul className="mt-4 space-y-2.5 text-xs text-white/80">
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms &amp; Conditions</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/cookies" className="hover:text-white transition-colors">Cookie Preferences</Link></li>
            </ul>

            <div className="mt-6 rounded-xl bg-[#323C4B] p-3.5 border border-[#4a586d]">
              <p className="text-[11px] font-bold text-white uppercase tracking-wider">Challenge 25</p>
              <p className="mt-1 text-[11px] leading-relaxed text-white/80">
                Under the Licensing Act 2003, it is an offence to sell alcohol to anyone under 18. Valid photo ID required.
              </p>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-[#3d495b] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/70">
          <p>© {currentYear} SIRAGRO. 147 North Hyde Road, Hayes, Middlesex UB3 4NS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

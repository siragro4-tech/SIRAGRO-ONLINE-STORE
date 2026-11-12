import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us | SIRAGRO Supermarket & Off-Licence",
  description:
    "Learn about SIRAGRO — your trusted local supermarket and off-licence at 147 North Hyde Road, Hayes UB3 4NS.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#1e2530]">
      {/* Header banner */}
      <section className="bg-[#323C4B] text-white py-14 border-b-4 border-[#242c37]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-block rounded-full bg-white text-[#323C4B] px-3.5 py-1 text-xs font-black uppercase tracking-wider mb-3">
              About SIRAGRO
            </span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
              Your Trusted High-Street Supermarket &amp; Off-Licence
            </h1>
            <p className="mt-4 text-base sm:text-lg text-white/90 leading-relaxed">
              Serving the Hayes, Southall, and UB3 community with daily fresh produce, grocery staples,
              chilled drinks, and essential in-store counter services.
            </p>
          </div>
        </div>
      </section>

      {/* Main content grid */}
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* Left 8 cols: Our Story & Values */}
          <div className="lg:col-span-8 space-y-10">
            {/* Story */}
            <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 shadow-sm">
              <h2 className="text-2xl font-black text-[#323C4B]">Our Story</h2>
              <div className="mt-4 space-y-4 text-sm text-slate-700 leading-relaxed">
                <p>
                  Conveniently situated at <strong>147 North Hyde Road, Hayes, Middlesex (UB3 4NS)</strong>,
                  <strong> SIRAGRO</strong> is a full-service neighbourhood supermarket and fully licensed off-licence.
                  We take pride in providing local families and residents with quick, dependable access to everything
                  they need for the home and pantry.
                </p>
                <p>
                  From farm-crisp fruits and fresh vegetables delivered daily, to dairy goods, pantry essentials,
                  chilled beers, world wines, and spirits, our shelves are stocked to make grocery shopping effortless
                  and affordable.
                </p>
              </div>
            </div>

            {/* Our 4 Commitments */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-sm">
                <div className="text-3xl mb-2">🥦</div>
                <h3 className="text-lg font-bold text-[#323C4B]">Fresh Daily Produce</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  We hand-select crisp vegetables and fresh fruits every single morning to ensure top quality for your dinner table.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-sm">
                <div className="text-3xl mb-2">🚚</div>
                <h3 className="text-lg font-bold text-[#323C4B]">Fast Local Delivery</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Order online before 6:00pm for prompt same-day delivery right to your door anywhere within a 5-mile radius of UB3 4NS.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-sm">
                <div className="text-3xl mb-2">🍷</div>
                <h3 className="text-lg font-bold text-[#323C4B]">Licensed Off-Licence</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  A comprehensive selection of chilled beers, ciders, spirits, and fine wines. We strictly enforce Challenge 25 for safe retailing.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-sm">
                <div className="text-3xl mb-2">🏪</div>
                <h3 className="text-lg font-bold text-[#323C4B]">One-Stop Services</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  PayPoint bill payments, National Lottery, Ria Money Transfer, KeyNest key collection, and same-day phone repairs.
                </p>
              </div>
            </div>

            {/* In-Store Counter Services */}
            <div className="bg-[#323C4B] text-white rounded-2xl p-8 border-2 border-[#242c37] shadow-lg">
              <h2 className="text-2xl font-black text-white">More Than Just a Supermarket</h2>
              <p className="mt-2 text-xs text-white/80">
                We also offer essential counter services open 7 days a week from 7:00am to 10:00pm:
              </p>
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { name: "PayPoint", desc: "Energy & utility bills" },
                  { name: "National Lottery", desc: "Draws & scratchcards" },
                  { name: "Ria Money Transfer", desc: "Global money transfer" },
                  { name: "KeyNest", desc: "Secure key handovers" },
                  { name: "Phone Repair", desc: "Screen & battery service" },
                  { name: "Parcel Hub", desc: "Convenient parcel pick-up" },
                ].map((s) => (
                  <div key={s.name} className="bg-[#242c37] rounded-xl p-3 border border-[#4a586d]">
                    <p className="text-xs font-bold text-white">{s.name}</p>
                    <p className="text-[10px] text-white/70">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right 4 cols: Store Details & Fast Links */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl p-6 border-2 border-[#323C4B] shadow-md">
              <h3 className="text-base font-black text-[#323C4B] uppercase tracking-wider mb-4">
                Store Information
              </h3>
              <div className="space-y-4 text-xs text-slate-700">
                <div>
                  <p className="font-bold text-slate-900">📍 Address</p>
                  <p className="mt-1 leading-relaxed">
                    147 North Hyde Road<br />
                    Hayes, Middlesex<br />
                    UB3 4NS
                  </p>
                </div>
                <div>
                  <p className="font-bold text-slate-900">📞 Phone Numbers</p>
                  <p className="mt-1">
                    <a href="tel:02088136458" className="font-bold text-[#323C4B] hover:underline">020 8813 6458</a><br />
                    <a href="tel:02088484840" className="font-bold text-[#323C4B] hover:underline">0208 848 4840</a>
                  </p>
                </div>
                <div>
                  <p className="font-bold text-slate-900">🕐 Trading Hours</p>
                  <p className="mt-1 font-semibold text-emerald-700">
                    Monday – Sunday: 7:00am – 10:00pm
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col gap-2">
                <Link
                  href="/shop"
                  className="rounded-xl bg-[#323C4B] text-white text-center py-3 text-xs font-bold hover:bg-[#242c37] transition-colors"
                >
                  🛒 Start Shopping Online
                </Link>
                <Link
                  href="/contact"
                  className="rounded-xl border-2 border-[#323C4B] text-[#323C4B] text-center py-2.5 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Get in Touch
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

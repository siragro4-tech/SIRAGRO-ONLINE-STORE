import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Delivery Information & Coverage | SIRAGRO",
  description:
    "Learn about SIRAGRO delivery zones, same-day delivery across Hayes (UB3 4NS) up to 5 miles, and free in-store collection.",
};

export default function DeliveryInfoPage() {
  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#1e2530]">
      {/* Header banner */}
      <section className="bg-[#323C4B] text-white py-14 border-b-4 border-[#242c37]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-block rounded-full bg-white text-[#323C4B] px-3.5 py-1 text-xs font-black uppercase tracking-wider mb-3">
              Home Delivery &amp; Click &amp; Collect
            </span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
              Delivery Information
            </h1>
            <p className="mt-4 text-base sm:text-lg text-white/90 leading-relaxed">
              Fast, reliable same-day delivery dispatched directly from 147 North Hyde Road, Hayes UB3 4NS,
              or free collection in 30 minutes.
            </p>
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* Left 8 cols: Delivery details */}
          <div className="lg:col-span-8 space-y-10">

            {/* Delivery Zones Table */}
            <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 shadow-sm">
              <h2 className="text-2xl font-black text-[#323C4B]">Delivery Zones &amp; Pricing</h2>
              <p className="mt-1 text-xs text-slate-500 mb-6">
                Delivery fees are calculated based on road distance from our shop anchor (UB3 4NS).
              </p>

              <div className="overflow-hidden rounded-xl border-2 border-[#323C4B] bg-white">
                <div className="grid grid-cols-4 bg-[#323C4B] text-white text-xs sm:text-sm font-bold py-3.5 px-4">
                  <div>Zone</div>
                  <div>Radius</div>
                  <div>Delivery Fee</div>
                  <div>Min. Order</div>
                </div>

                <div className="grid grid-cols-4 items-center text-xs sm:text-sm py-4 px-4 border-t border-slate-200 bg-white">
                  <div>
                    <strong className="text-[#323C4B] block">Zone 1</strong>
                    <span className="text-[11px] text-slate-500">Immediate</span>
                  </div>
                  <div className="text-slate-700">Up to 1.0 mile</div>
                  <div className="font-bold text-emerald-700">FREE over £25<span className="block text-[10px] text-slate-500 font-normal">Otherwise £2.49</span></div>
                  <div className="text-slate-700">£15.00</div>
                </div>

                <div className="grid grid-cols-4 items-center text-xs sm:text-sm py-4 px-4 border-t border-slate-200 bg-[#f8fafc]">
                  <div>
                    <strong className="text-[#323C4B] block">Zone 2</strong>
                    <span className="text-[11px] text-slate-500">Local Area</span>
                  </div>
                  <div className="text-slate-700">1.0 – 3.0 miles</div>
                  <div className="font-bold text-[#323C4B]">£3.99</div>
                  <div className="text-slate-700">£15.00</div>
                </div>

                <div className="grid grid-cols-4 items-center text-xs sm:text-sm py-4 px-4 border-t border-slate-200 bg-white">
                  <div>
                    <strong className="text-[#323C4B] block">Zone 3</strong>
                    <span className="text-[11px] text-slate-500">Extended</span>
                  </div>
                  <div className="text-slate-700">3.0 – 5.0 miles</div>
                  <div className="font-bold text-[#323C4B]">£4.99</div>
                  <div className="text-slate-700">£20.00</div>
                </div>

                <div className="grid grid-cols-4 items-center text-xs sm:text-sm py-4 px-4 border-t border-slate-200 bg-emerald-50/50">
                  <div>
                    <strong className="text-emerald-800 block">Click &amp; Collect</strong>
                    <span className="text-[11px] text-emerald-600">Counter Pickup</span>
                  </div>
                  <div className="text-slate-700">Any Distance</div>
                  <div className="font-black text-emerald-700">FREE Always</div>
                  <div className="text-slate-700">No Minimum</div>
                </div>
              </div>
            </div>

            {/* How Same-Day Delivery Works */}
            <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 shadow-sm">
              <h2 className="text-2xl font-black text-[#323C4B]">How Same-Day Delivery Works</h2>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-2xl mb-2">1️⃣</div>
                  <strong className="text-[#323C4B] text-sm block">Build Your Basket</strong>
                  <p className="mt-1 text-slate-600 leading-relaxed">
                    Choose fresh produce, chilled drinks, and household goods online.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-2xl mb-2">2️⃣</div>
                  <strong className="text-[#323C4B] text-sm block">Enter Your Postcode</strong>
                  <p className="mt-1 text-slate-600 leading-relaxed">
                    Our checkout verifies your exact distance from UB3 4NS automatically.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-2xl mb-2">3️⃣</div>
                  <strong className="text-[#323C4B] text-sm block">Same-Day Dispatch</strong>
                  <p className="mt-1 text-slate-600 leading-relaxed">
                    Orders placed before 6:00pm are delivered same-day directly to your door.
                  </p>
                </div>
              </div>
            </div>

            {/* Challenge 25 Rule */}
            <div className="bg-[#323C4B] text-white rounded-2xl p-8 border-2 border-[#242c37] shadow-lg">
              <div className="flex items-start gap-4">
                <span className="text-3xl">🪪</span>
                <div>
                  <h3 className="text-xl font-black text-white">Challenge 25 Policy on Alcohol &amp; Tobacco</h3>
                  <p className="mt-2 text-xs text-white/90 leading-relaxed">
                    Under the Licensing Act 2003, alcohol and age-restricted items can only be sold and delivered to
                    persons aged 18 or over. If the recipient appears under 25, our delivery drivers and store colleagues
                    will ask for valid photographic identification (UK Photo Driving Licence, Passport, or PASS card).
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Right 4 cols: Quick summary card */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl p-6 border-2 border-[#323C4B] shadow-md">
              <h3 className="text-base font-black text-[#323C4B] uppercase tracking-wider mb-4">
                Collection Point
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                Want to pick up yourself? In-store collection is 100% free with no minimum spend!
              </p>
              <div className="mt-4 p-3 rounded-xl bg-[#f8fafc] border border-slate-200 text-xs text-slate-800">
                <p className="font-bold">SIRAGRO Supermarket</p>
                <p>147 North Hyde Road, Hayes UB3 4NS</p>
                <p className="mt-1 text-emerald-700 font-semibold">Ready in ~30 mins</p>
              </div>

              <div className="mt-6">
                <Link
                  href="/shop"
                  className="block rounded-xl bg-[#323C4B] text-white text-center py-3 text-xs font-bold hover:bg-[#242c37] transition-colors"
                >
                  🛒 Start Shopping Now
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

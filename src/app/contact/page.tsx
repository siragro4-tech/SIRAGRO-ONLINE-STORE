import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us | SIRAGRO Supermarket & Off-Licence",
  description:
    "Get in touch with SIRAGRO. Find our address at 147 North Hyde Road, Hayes UB3 4NS, phone 020 8813 6458, and opening hours.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#1e2530]">
      {/* Header banner */}
      <section className="bg-[#323C4B] text-white py-14 border-b-4 border-[#242c37]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-block rounded-full bg-white text-[#323C4B] px-3.5 py-1 text-xs font-black uppercase tracking-wider mb-3">
              Customer Support &amp; Store Location
            </span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
              Contact SIRAGRO
            </h1>
            <p className="mt-4 text-base sm:text-lg text-white/90 leading-relaxed">
              Have a question about an order, delivery postcode, or in-store product? We are here to help 7 days a week.
            </p>
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* Left 7 cols: Contact Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 shadow-sm">
              <h2 className="text-2xl font-black text-[#323C4B]">Send Us a Message</h2>
              <p className="mt-1 text-xs text-slate-500">
                Fill in the details below and our team will get back to you promptly.
              </p>

              <ContactForm />
            </div>
          </div>

          {/* Right 5 cols: Direct Contact Info & Map placeholder */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#323C4B] text-white rounded-2xl p-6 border-2 border-[#242c37] shadow-lg">
              <h3 className="text-lg font-black text-white uppercase tracking-wider mb-4">
                Visit the Physical Store
              </h3>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <span className="text-xl">📍</span>
                  <div>
                    <strong className="text-white text-sm">Store Address:</strong>
                    <p className="mt-0.5 text-white/90 leading-relaxed">
                      147 North Hyde Road<br />
                      Hayes, Middlesex<br />
                      UB3 4NS
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-xl">📞</span>
                  <div>
                    <strong className="text-white text-sm">Phone Lines:</strong>
                    <p className="mt-0.5 text-white/90">
                      Primary: <a href="tel:02088136458" className="font-bold underline">020 8813 6458</a><br />
                      Counter: <a href="tel:02088484840" className="font-bold underline">0208 848 4840</a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-xl">🕐</span>
                  <div>
                    <strong className="text-white text-sm">Trading Hours:</strong>
                    <p className="mt-0.5 font-bold text-emerald-400">
                      Monday to Sunday: 7:00am – 10:00pm
                    </p>
                    <p className="text-[11px] text-white/70">Open all bank holidays.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick delivery notice */}
            <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-sm text-xs text-slate-700">
              <h4 className="font-bold text-[#323C4B] text-sm mb-1">Home Delivery Radius</h4>
              <p className="leading-relaxed">
                We deliver up to 5 miles from our store, covering UB3, Hayes, Southall, Cranford, Harlington and Heston.
                Free delivery on orders over £25 within 1 mile!
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

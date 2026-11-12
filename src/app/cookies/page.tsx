import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy | SIRAGRO Supermarket & Off-Licence",
  description: "Information regarding cookies and session management on the SIRAGRO online store.",
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#1e2530]">
      <section className="bg-[#323C4B] text-white py-12 border-b-4 border-[#242c37]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-black text-white">Cookie Policy</h1>
          <p className="mt-2 text-sm text-white/80">Last updated: November 2026</p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 shadow-sm space-y-8 text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-[#323C4B]">What Are Cookies?</h2>
            <p className="mt-2">
              Cookies are small text files stored on your browser or device when you browse websites.
              They allow the website to recognize your device and remember your preferences over time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#323C4B]">Cookies We Use</h2>
            <div className="mt-4 space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="text-[#323C4B] block">Essential Shopping Basket Cookies</strong>
                <p className="mt-1 text-xs text-slate-600">
                  Required for core store functionality, allowing you to add products to your basket and complete checkout.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="text-[#323C4B] block">Authentication &amp; Session Cookies</strong>
                <p className="mt-1 text-xs text-slate-600">
                  Used by our secure authentication provider (Supabase) to keep you logged in to your account.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#323C4B]">Managing Cookies</h2>
            <p className="mt-2">
              You can configure your browser to decline cookies. Please note that disabling essential cookies may prevent
              the shopping basket and checkout features from functioning correctly.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

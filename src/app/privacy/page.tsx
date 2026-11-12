import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | SIRAGRO Supermarket & Off-Licence",
  description: "Privacy policy and data protection information for SIRAGRO customers.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#1e2530]">
      <section className="bg-[#323C4B] text-white py-12 border-b-4 border-[#242c37]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-black text-white">Privacy Policy</h1>
          <p className="mt-2 text-sm text-white/80">Last updated: November 2026</p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 shadow-sm space-y-8 text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-[#323C4B]">1. Overview</h2>
            <p className="mt-2">
              SIRAGRO Supermarket &amp; Off-Licence (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting your privacy and personal data.
              This Privacy Policy explains how we collect, store, and process your personal information when you use our online store
              or order home delivery from our shop at 147 North Hyde Road, Hayes, Middlesex UB3 4NS.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#323C4B]">2. Information We Collect</h2>
            <p className="mt-2">
              When you create an account, place an order, or contact us, we may collect:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Your name, email address, and telephone number</li>
              <li>Delivery address and delivery instructions</li>
              <li>Order history and transaction details</li>
              <li>Age confirmation for age-restricted purchases</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#323C4B]">3. How We Use Your Data</h2>
            <p className="mt-2">
              Your information is used strictly to fulfill your orders, arrange delivery, communicate status updates,
              and comply with UK statutory regulations (including licensing requirements for alcohol sales).
              We do not sell your personal data to any third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#323C4B]">4. Secure Payments</h2>
            <p className="mt-2">
              All payment transactions are encrypted and processed through our PCI-DSS compliant payment partner (Stripe).
              We do not store your debit or credit card numbers on our servers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#323C4B]">5. Your Rights</h2>
            <p className="mt-2">
              Under UK GDPR, you have the right to access, rectify, or request deletion of your personal data.
              To make a request, please contact our team at 020 8813 6458.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

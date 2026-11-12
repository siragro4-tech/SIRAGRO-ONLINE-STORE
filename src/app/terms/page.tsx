import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions | SIRAGRO Supermarket & Off-Licence",
  description: "Terms and conditions of service for SIRAGRO online grocery and off-licence store.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#1e2530]">
      <section className="bg-[#323C4B] text-white py-12 border-b-4 border-[#242c37]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-black text-white">Terms &amp; Conditions</h1>
          <p className="mt-2 text-sm text-white/80">Last updated: November 2026</p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 shadow-sm space-y-8 text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-[#323C4B]">1. Introduction &amp; About Us</h2>
            <p className="mt-2">
              These terms and conditions govern your use of the SIRAGRO online store (the &quot;Site&quot;) and your purchase of goods
              from SIRAGRO Supermarket &amp; Off-Licence, operating from 147 North Hyde Road, Hayes, Middlesex UB3 4NS (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;).
              By placing an order on our website, you agree to be bound by these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#323C4B]">2. Eligibility &amp; Age-Restricted Goods (Challenge 25)</h2>
            <p className="mt-2">
              You must be at least 18 years old to purchase alcohol, tobacco, or lottery products.
              In accordance with UK law and our Challenge 25 policy, any recipient who appears under 25 years of age
              will be required to show valid photographic identification upon delivery or in-store collection.
              Acceptable forms of ID include a valid UK/EU passport, photocard driving licence, or PASS accredited proof of age card.
              If valid ID cannot be produced, age-restricted items will be withheld and cancelled.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#323C4B]">3. Orders, Pricing &amp; Availability</h2>
            <p className="mt-2">
              All prices shown on the Site are in Pounds Sterling (£) and include VAT where applicable.
              All orders are subject to acceptance and product availability. If an item is out of stock, we will notify you
              and process a full refund for that item to your original payment method.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#323C4B]">4. Delivery &amp; Collection</h2>
            <p className="mt-2">
              We deliver within a maximum 5.0-mile radius from our store at 147 North Hyde Road, Hayes UB3 4NS.
              Delivery charges and minimum order values are calculated by zone at checkout based on road distance.
              Same-day delivery is available for orders confirmed prior to 6:00pm.
              Free in-store Click &amp; Collect is available during our standard opening hours (7:00am – 10:00pm daily).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#323C4B]">5. Payments &amp; Security</h2>
            <p className="mt-2">
              Online payments are securely processed by Stripe. We do not store your full card details on our servers.
              Payment must be completed in full before orders are dispatched or made ready for collection.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#323C4B]">6. Contact Information</h2>
            <p className="mt-2">
              If you have any questions regarding your order or these Terms, please contact us by telephone at 020 8813 6458
              or in person at 147 North Hyde Road, Hayes, Middlesex UB3 4NS.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

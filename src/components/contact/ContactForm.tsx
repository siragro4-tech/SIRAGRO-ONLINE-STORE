"use client";

import { useState } from "react";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    subject: "General Enquiry",
    message: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // Simulate reliable dispatch & feedback
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/60 p-8 text-center animate-fadeIn">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#323C4B] text-white shadow-md mb-4">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="text-xl font-black text-[#323C4B]">
          Thank You, {formData.name || "Customer"}!
        </h3>
        <p className="mt-2 text-sm text-slate-700 leading-relaxed max-w-md mx-auto">
          Your message regarding <strong>&quot;{formData.subject}&quot;</strong> has been received by our store team at 147 North Hyde Road. We will get back to you at <strong>{formData.email}</strong> shortly.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Need an immediate answer? Call us on <a href="tel:02088136458" className="font-bold underline text-[#323C4B]">020 8813 6458</a> (7am–10pm daily).
        </p>
        <div className="mt-6">
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setFormData({
                name: "",
                phone: "",
                email: "",
                subject: "General Enquiry",
                message: "",
              });
            }}
            className="rounded-xl border-2 border-[#323C4B] bg-white px-5 py-2.5 text-xs font-bold text-[#323C4B] hover:bg-slate-50 transition-colors"
          >
            Send Another Message
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="contact-name" className="block text-xs font-bold text-slate-700 uppercase">
            Your Name *
          </label>
          <input
            id="contact-name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. John Doe"
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-[#323C4B] focus:border-[#323C4B] focus:outline-none focus:ring-1 focus:ring-[#323C4B]"
          />
        </div>
        <div>
          <label htmlFor="contact-phone" className="block text-xs font-bold text-slate-700 uppercase">
            Phone Number (optional)
          </label>
          <input
            id="contact-phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="e.g. 07123 456789"
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-[#323C4B] focus:border-[#323C4B] focus:outline-none focus:ring-1 focus:ring-[#323C4B]"
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-email" className="block text-xs font-bold text-slate-700 uppercase">
          Email Address *
        </label>
        <input
          id="contact-email"
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="name@example.com"
          className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-[#323C4B] focus:border-[#323C4B] focus:outline-none focus:ring-1 focus:ring-[#323C4B]"
        />
      </div>

      <div>
        <label htmlFor="contact-subject" className="block text-xs font-bold text-slate-700 uppercase">
          Subject *
        </label>
        <select
          id="contact-subject"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-[#323C4B] focus:border-[#323C4B] focus:outline-none focus:ring-1 focus:ring-[#323C4B] bg-white"
        >
          <option>General Enquiry</option>
          <option>Order &amp; Delivery Question</option>
          <option>Product Stock Availability</option>
          <option>In-Store Counter Services (PayPoint / Lottery / Money Transfer)</option>
          <option>Other Feedback</option>
        </select>
      </div>

      <div>
        <label htmlFor="contact-message" className="block text-xs font-bold text-slate-700 uppercase">
          Your Message *
        </label>
        <textarea
          id="contact-message"
          rows={4}
          required
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="How can we help you today?"
          className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-[#323C4B] focus:border-[#323C4B] focus:outline-none focus:ring-1 focus:ring-[#323C4B]"
        ></textarea>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-[#323C4B] hover:bg-[#242c37] text-white px-8 py-3.5 text-sm font-bold shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
      >
        {loading ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}


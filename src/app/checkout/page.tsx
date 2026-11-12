import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getBasket } from "@/lib/basket";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Secure checkout for your SIRAGRO grocery and off-licence order.",
};

export default async function CheckoutPage() {
  const summary = await getBasket();

  // If the basket is empty, redirect to the basket page
  if (summary.items.length === 0) {
    redirect("/basket");
  }

  // Pre-load user profile if logged in
  let initialProfile = null;
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, first_name, last_name, phone")
        .eq("id", user.id)
        .single();
      initialProfile = profile;
    }
  } catch {
    // Guest customer
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-gray-500 mb-6">
        <Link href="/" className="hover:text-[#323C4B] transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/basket" className="hover:text-[#323C4B] transition-colors">
          Basket
        </Link>
        <span>/</span>
        <span className="font-semibold text-gray-900" aria-current="page">
          Checkout
        </span>
      </nav>

      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Complete Your Order
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Review your details, choose delivery or collection, and pay securely via Stripe.
        </p>
      </div>

      {/* Render Checkout Form */}
      <CheckoutForm summary={summary} initialProfile={initialProfile} />
    </div>
  );
}


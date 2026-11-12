import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { logoutAction } from "@/app/auth/actions";
import { ProfileForm } from "@/components/account/ProfileForm";
import { AddressCard } from "@/components/account/AddressCard";
import { AddAddressForm } from "@/components/account/AddAddressForm";

export const metadata: Metadata = {
  title: "Your Account",
  description: "Manage your SIRAGRO account, view orders, and update your delivery addresses.",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/account");
  }

  // 1. Fetch Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // 2. Fetch User Orders
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  // 3. Fetch User Saved Addresses
  const { data: addresses } = await supabase
    .from("addresses")
    .select("*")
    .eq("profile_id", user.id)
    .order("is_default", { ascending: false });

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    processing: "bg-blue-100 text-blue-800",
    ready_for_pickup: "bg-purple-100 text-purple-800",
    out_for_delivery: "bg-amber-100 text-amber-800",
    delivered: "bg-green-100 text-green-800",
    collected: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const statusLabels: Record<string, string> = {
    pending: "Payment Pending",
    processing: "Packing in Store",
    ready_for_pickup: "Ready for Pickup",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    collected: "Collected",
    cancelled: "Cancelled",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-6 gap-4">
        <div>
          <span className="inline-block rounded-full bg-[#323C4B] text-white px-3 py-0.5 text-[11px] font-black uppercase tracking-wider">
            Customer Dashboard
          </span>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-[#323C4B] sm:text-3xl">
            Welcome, {profile?.first_name || "Customer"}!
          </h1>
          <p className="mt-1 text-xs text-gray-500">
            Account email: {profile?.email || user.email}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {profile?.role === "admin" && (
            <Link
              href="/admin"
              className="rounded-xl bg-[#323C4B] text-white px-4 py-2 text-xs font-bold hover:bg-[#242c37] transition-all shadow-sm"
            >
              Open Admin Dashboard &rarr;
            </Link>
          )}

          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column (8 cols): Orders History & Saved Addresses */}
        <div className="space-y-8 lg:col-span-8">
          {/* Orders Section */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-green-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
                <h2 className="text-base font-bold text-gray-900">Your Orders</h2>
              </div>
              <span className="text-xs text-gray-500">
                {orders?.length || 0} {orders?.length === 1 ? "order" : "orders"}
              </span>
            </div>

            {!orders || orders.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500">
                <p>You haven&apos;t placed any orders yet.</p>
                <div className="mt-4">
                  <Link
                    href="/shop"
                    className="inline-flex items-center rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    Start Shopping &rarr;
                  </Link>
                </div>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-gray-100" role="list">
                {orders.map((ord) => (
                  <li key={ord.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/account/orders/${ord.id}`}
                          className="font-mono text-sm font-bold text-green-700 hover:underline"
                        >
                          #{ord.order_number}
                        </Link>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColors[ord.status] || "bg-gray-100 text-gray-800"
                            }`}
                        >
                          {statusLabels[ord.status] || ord.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(ord.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        • {ord.fulfilment_type === "delivery" ? "Home Delivery" : "Collection"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <span className="text-sm font-bold text-gray-900">
                        £{Number(ord.total).toFixed(2)}
                      </span>
                      <Link
                        href={`/account/orders/${ord.id}`}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        View receipt &rarr;
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Saved Addresses Section */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-green-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
                <h2 className="text-base font-bold text-gray-900">Saved Delivery Addresses</h2>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {addresses?.map((addr) => (
                <AddressCard key={addr.id} address={addr} />
              ))}
            </div>

            <div className="mt-4">
              <AddAddressForm />
            </div>
          </section>
        </div>

        {/* Right Column (4 cols): Personal Details */}
        <div className="lg:col-span-4">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
              Personal Information
            </h2>
            <ProfileForm
              initialProfile={{
                first_name: profile?.first_name,
                last_name: profile?.last_name,
                phone: profile?.phone,
                email: profile?.email || user.email || "",
              }}
            />
          </section>

          {/* Quick Help Card */}
          <div className="mt-6 rounded-2xl bg-green-50/70 border border-green-200 p-5 text-xs text-green-900">
            <h3 className="font-bold">Need Help with an Order?</h3>
            <p className="mt-1 leading-relaxed">
              Contact our physical store near UB3 4NS. We can assist with substitutions, delivery timing, or collection status.
            </p>
            <div className="mt-3">
              <Link href="/contact" className="font-semibold text-green-700 hover:underline">
                Contact Customer Support &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

type DeliveryAddressJson = {
  line1?: string;
  city?: string;
  postcode?: string;
};

export const metadata: Metadata = {
  title: "Order Details",
  robots: { index: false, follow: false },
};

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/account");
  }

  // Query order enforcing user profile_id ownership
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("profile_id", user.id)
    .single();

  if (!order) {
    notFound();
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", order.id);

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
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-gray-500 mb-6">
        <Link href="/" className="hover:text-green-700 transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/account" className="hover:text-green-700 transition-colors">
          My Account
        </Link>
        <span>/</span>
        <span className="font-semibold text-gray-900" aria-current="page">
          Order #{order.order_number}
        </span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-4 gap-2">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Order #{order.order_number}
            </h1>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                statusColors[order.status] || "bg-gray-100 text-gray-800"
              }`}
            >
              {statusLabels[order.status] || order.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Placed on {new Date(order.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-500">Payment Status</p>
          <span className="font-semibold text-xs text-green-700 uppercase tracking-wider">
            ✓ {order.payment_status}
          </span>
        </div>
      </div>

      {/* Fulfilment Banner */}
      <div className="mt-6 rounded-xl bg-gray-50 p-4 border border-gray-200 text-xs text-gray-700">
        <p className="font-bold text-gray-900 text-sm">
          {order.fulfilment_type === "delivery" ? "🚚 Home Delivery" : "🏬 In-Store Collection"}
        </p>
        {order.fulfilment_type === "delivery" ? (
          <p className="mt-1">
            Deliver to:{" "}
            {order.delivery_address
              ? typeof order.delivery_address === "string"
                ? order.delivery_address
                : (() => {
                    const addr = order.delivery_address as DeliveryAddressJson;
                    return `${addr.line1 || ""}, ${addr.city || ""}, ${addr.postcode || ""}`;
                  })()
              : "Address recorded at checkout"}
          </p>
        ) : (
          <p className="mt-1">
            Collection Point: SIRAGRO Store near UB3 4NS (Hayes, Middlesex). Please show your order number when collecting.
          </p>
        )}
      </div>

      {/* Order Items Table */}
      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
          Items in this order
        </h2>

        <ul className="divide-y divide-gray-100" role="list">
          {(items || []).map((item) => (
            <li key={item.id} className="flex justify-between py-3 text-sm">
              <div>
                <p className="font-medium text-gray-900">{item.product_name_snapshot}</p>
                <p className="text-xs text-gray-500">
                  £{Number(item.unit_price_snapshot).toFixed(2)} × {item.quantity}
                </p>
              </div>
              <span className="font-semibold text-gray-900">
                £{Number(item.line_total).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 border-t border-gray-200 pt-4 space-y-1.5 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>£{Number(order.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Fulfilment Fee</span>
            <span>
              {Number(order.delivery_charge) === 0 ? "FREE" : `£${Number(order.delivery_charge).toFixed(2)}`}
            </span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
            <span>Total Paid</span>
            <span className="text-green-700">£{Number(order.total).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Link
          href="/account"
          className="inline-flex items-center text-xs font-semibold text-green-700 hover:text-green-800"
        >
          &larr; Back to My Account
        </Link>
      </div>
    </div>
  );
}


import type { Metadata } from "next";
import Link from "next/link";
import { getVerifiedOrder } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Order Confirmation",
  description: "Thank you for your order with SIRAGRO.",
  robots: {
    index: false,
    follow: false,
  },
};

interface OrderConfirmationPageProps {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function OrderConfirmationPage({
  searchParams,
}: OrderConfirmationPageProps) {
  const { session_id } = await searchParams;

  const order = session_id ? await getVerifiedOrder(session_id) : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Success Badge */}
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>

        <span className="mt-4 inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
          ✓ Payment Verified &amp; Confirmed
        </span>

        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Thank you for your order!
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          We&apos;ve sent a confirmation receipt to{" "}
          <strong className="text-gray-900">{order?.customerEmail || "your email"}</strong>.
        </p>
      </div>

      {/* Order Details Card */}
      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-4 gap-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
              Order Reference
            </p>
            <p className="font-mono text-xl font-bold text-green-700">
              {order?.orderNumber || (session_id ? `SIR-${session_id.slice(-6).toUpperCase()}` : "SIR-PENDING")}
            </p>
          </div>

          <div className="sm:text-right">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
              Fulfilment Method
            </p>
            <p className="text-sm font-bold text-gray-900">
              {order?.fulfilmentType === "collection" ? "🏬 In-Store Collection" : "🚚 Local Home Delivery"}
            </p>
          </div>
        </div>

        {/* Fulfilment Instructions */}
        <div className="mt-6 rounded-xl bg-gray-50 p-4 border border-gray-200 text-sm text-gray-700">
          {order?.fulfilmentType === "collection" ? (
            <div>
              <p className="font-bold text-gray-900">🏬 Collection Instructions:</p>
              <p className="mt-1">
                Your order is being assembled. It will be ready for pickup at our shop near <strong>UB3 4NS</strong> (Hayes, Middlesex) within approximately 1 hour.
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Please bring your order reference or confirmation email with you when collecting.
              </p>
            </div>
          ) : (
            <div>
              <p className="font-bold text-gray-900">🚚 Home Delivery Instructions:</p>
              <p className="mt-1">
                Your groceries are being packed and will be dispatched by our local driver.
                {order?.deliveryAddress && (
                  <span className="block mt-1 font-medium">Deliver to: {order.deliveryAddress}</span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Challenge 25 Advisory */}
        {order?.hasAgeRestrictedItems && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-900">
            <p className="font-bold text-red-800">
              🔞 Challenge 25 Notice:
            </p>
            <p className="mt-0.5">
              This order contains age-restricted products. The recipient must be present with valid photographic ID (Passport, Driving Licence, or PASS card) upon handover.
            </p>
          </div>
        )}

        {/* Itemised Breakdown */}
        {order?.items && order.items.length > 0 && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Items Purchased
            </h2>
            <ul className="mt-4 divide-y divide-gray-100" role="list">
              {order.items.map((item, idx) => (
                <li key={idx} className="flex justify-between py-2 text-sm">
                  <span>
                    {item.name} <span className="text-gray-500">× {item.quantity}</span>
                  </span>
                  <span className="font-medium text-gray-900">
                    £{item.lineTotal.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 border-t border-gray-100 pt-3 space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>£{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Fulfilment Fee</span>
                <span>{order.deliveryCharge === 0 ? "FREE" : `£${order.deliveryCharge.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
                <span>Total Paid</span>
                <span className="text-green-700">£{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Next Steps Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
          <Link
            href="/shop"
            className="flex-1 flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Continue Shopping
          </Link>
          <Link
            href="/account"
            className="flex-1 flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            View in My Account
          </Link>
        </div>
      </div>
    </div>
  );
}


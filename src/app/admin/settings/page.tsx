import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin-auth";
import { DeliverySettingsForm } from "@/components/admin/DeliverySettingsForm";

export const metadata: Metadata = {
  title: "Store & Delivery Settings",
};

export default async function AdminSettingsPage() {
  const { supabase } = await requireAdminPage("/admin/settings");

  const { data: settings, error } = await supabase
    .from("delivery_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  const isPricingConfirmed =
    Boolean(settings) &&
    (settings as { is_delivery_pricing_confirmed?: boolean })
      .is_delivery_pricing_confirmed === true;

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#323C4B] sm:text-3xl">
          Store &amp; Delivery Settings
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Review verified shop details, delivery calculation parameters, and admin security configuration.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Could not load delivery settings: {error.message}
        </div>
      )}

      {/* Store Information */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-[#323C4B] border-b border-slate-100 pb-3">
          Store Hub Details
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs font-bold uppercase text-slate-500">Store Address</dt>
            <dd className="mt-1 font-semibold text-slate-900">
              147 North Hyde Road, Hayes, Middlesex UB3 4NS
            </dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase text-slate-500">Contact Numbers</dt>
            <dd className="mt-1 font-semibold text-slate-900">
              020 8813 6458 / 0208 848 4840
            </dd>
          </div>
        </dl>
      </div>

      {/* Delivery Pricing Confirmation Warning */}
      {settings && !isPricingConfirmed && (
        <div
          role="alert"
          className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 space-y-1.5"
        >
          <p className="font-extrabold">
            Delivery Pricing Not Confirmed — Home Delivery Checkout Blocked
          </p>
          <p className="text-xs leading-relaxed">
            Required store rules are still unconfirmed (fee for orders of £25 or less within 1 mile, 1–5 mile charge(s), whether a 3-mile split applies, exact 1-mile and 5-mile boundary rules, and straight-line vs road distance). To protect customers and the business, home delivery checkout is disabled server-side and unapproved default fees are hidden until explicitly confirmed in{" "}
            <code className="font-mono">delivery_settings.is_delivery_pricing_confirmed</code>. Store collection remains available when enabled.
          </p>
        </div>
      )}

      {/* Live Delivery Settings Table View */}
      {settings && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#323C4B] border-b border-slate-100 pb-3">
              Active Checkout Calculation Rules
            </h2>
            <p className="text-xs text-slate-500">
              Evaluated strictly on the server at checkout. Both home delivery and store collection fail closed if store settings cannot be verified.
            </p>
            <dl className="divide-y divide-slate-100 text-xs">
              <div className="flex justify-between py-2.5">
                <dt className="text-slate-500">Pricing Confirmation</dt>
                <dd
                  className={`font-bold ${
                    isPricingConfirmed ? "text-emerald-700" : "text-amber-800"
                  }`}
                >
                  {isPricingConfirmed
                    ? "Confirmed (Active)"
                    : "Not Confirmed (Delivery blocked)"}
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-slate-500">Origin Postcode</dt>
                <dd className="font-mono font-bold text-slate-900">{settings.shop_postcode}</dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-slate-500">Distance Calculation</dt>
                <dd className="font-semibold text-slate-900">
                  {settings.distance_method === "driving"
                    ? "Driving distance"
                    : "Straight-line (Haversine)"}
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-slate-500">Free Delivery Rule</dt>
                <dd className="font-semibold text-slate-900">
                  Within {settings.free_delivery_radius_miles} mile (strictly over £
                  {Number(settings.free_delivery_min_subtotal).toFixed(2)})
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-slate-500">Maximum Delivery Radius</dt>
                <dd className="font-semibold text-slate-900">
                  {settings.max_delivery_radius_miles} miles
                </dd>
              </div>
              {isPricingConfirmed ? (
                <>
                  <div className="flex justify-between py-2.5">
                    <dt className="text-slate-500">Confirmed Fee (up to 3 miles / ≤ £25)</dt>
                    <dd className="font-mono font-bold text-slate-900">
                      £{Number(settings.delivery_fee_tier_1).toFixed(2)}
                    </dd>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <dt className="text-slate-500">Confirmed Fee (3–5 miles)</dt>
                    <dd className="font-mono font-bold text-slate-900">
                      £{Number(settings.delivery_fee_tier_2).toFixed(2)}
                    </dd>
                  </div>
                </>
              ) : (
                <div className="flex justify-between py-2.5 gap-4">
                  <dt className="text-slate-500">Delivery Fees</dt>
                  <dd className="font-semibold text-amber-800 text-right">
                    Unconfirmed — unapproved prices hidden and not charged
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#323C4B] border-b border-slate-100 pb-3">
              Fulfilment Availability Controls
            </h2>
            <DeliverySettingsForm
              settings={{
                id: settings.id,
                is_delivery_enabled: settings.is_delivery_enabled,
                is_collection_enabled: settings.is_collection_enabled,
                is_delivery_pricing_confirmed: isPricingConfirmed,
                notes: settings.notes,
              }}
            />
          </div>
        </div>
      )}

      {/* Owner / Staff Access Notice */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-2">
        <h2 className="text-base font-bold text-[#323C4B]">
          Admin Account Security Policy
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Public admin registration is intentionally disabled. New staff/owner accounts register as regular customers via{" "}
          <code className="font-mono">/register</code> and are promoted exclusively by the database owner in Supabase by updating{" "}
          <code className="font-mono">public.profiles.role = &apos;admin&apos;</code>.
        </p>
      </div>
    </div>
  );
}

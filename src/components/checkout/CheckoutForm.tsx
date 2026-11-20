"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import type { BasketSummary } from "@/lib/basket";
import type { StockShortageItem } from "@/lib/checkout-draft-rules";
import type {
  DeliveryCalculationResult,
  FulfilmentAvailability,
} from "@/lib/delivery";
import { validatePostcodeAction, createCheckoutSessionAction } from "@/app/checkout/actions";

interface CheckoutFormProps {
  summary: BasketSummary;
  initialProfile?: {
    email?: string;
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
  } | null;
  availability: FulfilmentAvailability;
}

export function CheckoutForm({
  summary,
  initialProfile,
  availability,
}: CheckoutFormProps) {
  const [fulfilmentType, setFulfilmentType] = useState<
    "delivery" | "collection" | null
  >(
    availability.deliveryAvailable
      ? "delivery"
      : availability.collectionAvailable
        ? "collection"
        : null
  );
  const [postcode, setPostcode] = useState("");
  const [deliveryResult, setDeliveryResult] = useState<DeliveryCalculationResult | null>(null);
  const [isCheckingPostcode, startPostcodeCheck] = useTransition();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shortages, setShortages] = useState<StockShortageItem[]>([]);
  const [isSubmitting, startSubmission] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const currentDeliveryFee =
    fulfilmentType === "delivery" ? deliveryResult?.deliveryFee || 0.0 : 0.0;
  const totalAmount = summary.subtotal + currentDeliveryFee;

  function handleCheckPostcode() {
    if (!postcode.trim()) return;
    setErrorMessage(null);

    startPostcodeCheck(async () => {
      const res = await validatePostcodeAction(postcode);
      setDeliveryResult(res);
      if (!res.isEligible && res.reason) {
        setErrorMessage(res.reason);
      }
    });
  }

  function submitCheckout(acceptAvailable: boolean) {
    setErrorMessage(null);

    if (!fulfilmentType) {
      setErrorMessage(
        "Checkout is currently unavailable because no verified fulfilment option is active."
      );
      return;
    }

    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    formData.set("fulfilmentType", fulfilmentType);
    if (acceptAvailable) {
      formData.set("acceptAvailableQuantities", "true");
    }

    startSubmission(async () => {
      const result = await createCheckoutSessionAction(null, formData);
      if (result.shortages && result.shortages.length > 0) {
        setShortages(result.shortages);
        setErrorMessage(result.error || "Some items have limited stock.");
      } else if (result.error) {
        setShortages([]);
        setErrorMessage(result.error);
      } else if (result.url) {
        setShortages([]);
        window.location.href = result.url;
      }
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    submitCheckout(false);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="mt-8 space-y-8">
      {shortages.length > 0 && (
        <div
          role="alert"
          className="rounded-xl border-2 border-amber-300 bg-amber-50 p-5 text-sm text-amber-950 space-y-3"
        >
          <p className="font-bold text-base">Stock Shortage — Action Required</p>
          <p className="text-xs leading-relaxed">
            Some items in your basket do not have enough stock available. We will never reduce quantities without your permission.
          </p>
          <ul className="divide-y divide-amber-200 rounded-lg border border-amber-200 bg-white text-xs">
            {shortages.map((s) => (
              <li key={s.productId} className="flex items-center justify-between px-3 py-2 gap-3">
                <span className="font-semibold text-slate-900">{s.productName}</span>
                <span className="shrink-0 font-mono text-amber-900">
                  Requested: {s.requestedQuantity} • Available: {s.availableQuantity}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => submitCheckout(true)}
              className="rounded-lg bg-[#323C4B] px-4 py-2 text-xs font-bold text-white hover:bg-[#242c37] disabled:opacity-50"
            >
              {isSubmitting ? "Updating & reserving..." : "Accept Available Quantities & Continue"}
            </button>
            <Link
              href="/basket"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-[#323C4B] hover:bg-slate-50"
            >
              Edit Basket
            </Link>
          </div>
        </div>
      )}

      {errorMessage && shortages.length === 0 && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <p className="font-semibold">Unable to proceed:</p>
          <p className="mt-1">{errorMessage}</p>
        </div>
      )}

      {/* 1. Contact Information */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
          1. Contact Details
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="customerName" className="block text-xs font-semibold text-gray-700">
              Full Name *
            </label>
            <input
              id="customerName"
              name="customerName"
              type="text"
              required
              defaultValue={
                initialProfile
                  ? `${initialProfile.first_name || ""} ${initialProfile.last_name || ""}`.trim()
                  : ""
              }
              placeholder="e.g. John Smith"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#323C4B] focus:outline-none focus:ring-1 focus:ring-[#323C4B]"
            />
          </div>

          <div>
            <label htmlFor="customerEmail" className="block text-xs font-semibold text-gray-700">
              Email Address (for order confirmation) *
            </label>
            <input
              id="customerEmail"
              name="customerEmail"
              type="email"
              required
              defaultValue={initialProfile?.email || ""}
              placeholder="you@example.com"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#323C4B] focus:outline-none focus:ring-1 focus:ring-[#323C4B]"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="customerPhone" className="block text-xs font-semibold text-gray-700">
              Phone Number (for driver delivery updates) *
            </label>
            <input
              id="customerPhone"
              name="customerPhone"
              type="tel"
              required
              defaultValue={initialProfile?.phone || ""}
              placeholder="e.g. 07123 456789"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#323C4B] focus:outline-none focus:ring-1 focus:ring-[#323C4B]"
            />
          </div>
        </div>
      </div>

      {/* 2. Fulfilment Method Choice */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
          2. How would you like your order?
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Home Delivery Card */}
          <label
            className={`flex flex-col rounded-xl border-2 p-4 transition-all ${!availability.deliveryAvailable
              ? "cursor-not-allowed border-gray-200 bg-gray-100/70 opacity-75"
              : fulfilmentType === "delivery"
                ? "cursor-pointer border-[#323C4B] bg-[#323C4B]/5 ring-2 ring-[#323C4B]"
                : "cursor-pointer border-gray-200 hover:border-gray-300"
              }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900">🚚 Home Delivery</span>
              <input
                type="radio"
                name="fulfilmentTypeRadio"
                disabled={!availability.deliveryAvailable}
                checked={fulfilmentType === "delivery"}
                onChange={() => {
                  if (availability.deliveryAvailable) {
                    setFulfilmentType("delivery");
                  }
                }}
                className="h-4 w-4 text-[#323C4B] focus:ring-[#323C4B] disabled:opacity-50"
              />
            </div>
            {availability.deliveryAvailable ? (
              <p className="mt-2 text-xs text-gray-500">
                Delivered within 5 miles of UB3 4NS. Free over £25 within 1 mile.
              </p>
            ) : (
              <p className="mt-2 text-xs font-medium text-amber-800">
                {availability.deliveryUnavailableReason ||
                  "Home delivery is currently unavailable."}
              </p>
            )}
          </label>

          {/* In-Store Collection Card */}
          <label
            className={`flex flex-col rounded-xl border-2 p-4 transition-all ${!availability.collectionAvailable
              ? "cursor-not-allowed border-gray-200 bg-gray-100/70 opacity-75"
              : fulfilmentType === "collection"
                ? "cursor-pointer border-[#323C4B] bg-[#323C4B]/5 ring-2 ring-[#323C4B]"
                : "cursor-pointer border-gray-200 hover:border-gray-300"
              }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900">🏬 In-Store Collection</span>
              <input
                type="radio"
                name="fulfilmentTypeRadio"
                disabled={!availability.collectionAvailable}
                checked={fulfilmentType === "collection"}
                onChange={() => {
                  if (availability.collectionAvailable) {
                    setFulfilmentType("collection");
                  }
                }}
                className="h-4 w-4 text-[#323C4B] focus:ring-[#323C4B] disabled:opacity-50"
              />
            </div>
            {availability.collectionAvailable ? (
              <p className="mt-2 text-xs text-gray-500">
                Pick up directly from our shop near UB3 4NS. Always free with no minimum spend!
              </p>
            ) : (
              <p className="mt-2 text-xs font-medium text-red-700">
                {availability.collectionUnavailableReason ||
                  "In-store collection is currently unavailable."}
              </p>
            )}
          </label>
        </div>

        {!availability.deliveryAvailable && !availability.collectionAvailable && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800"
          >
            Both Home Delivery and In-Store Collection are currently unavailable. Checkout cannot proceed until a fulfilment option is enabled and verified.
          </div>
        )}
      </div>

      {/* 3. Delivery Address / Collection Details */}
      {fulfilmentType === "delivery" ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
            3. Delivery Address
          </h2>

          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="addressLine1" className="block text-xs font-semibold text-gray-700">
                Street Address *
              </label>
              <input
                id="addressLine1"
                name="addressLine1"
                type="text"
                required
                placeholder="e.g. 14 High Street"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#323C4B] focus:outline-none focus:ring-1 focus:ring-[#323C4B]"
              />
            </div>

            <div>
              <label htmlFor="addressLine2" className="block text-xs font-semibold text-gray-700">
                Flat, suite, or unit (optional)
              </label>
              <input
                id="addressLine2"
                name="addressLine2"
                type="text"
                placeholder="e.g. Flat 2B"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#323C4B] focus:outline-none focus:ring-1 focus:ring-[#323C4B]"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="city" className="block text-xs font-semibold text-gray-700">
                  Town / City *
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  required
                  defaultValue="Hayes"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#323C4B] focus:outline-none focus:ring-1 focus:ring-[#323C4B]"
                />
              </div>

              <div>
                <label htmlFor="postcode" className="block text-xs font-semibold text-gray-700">
                  Postcode *
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    id="postcode"
                    name="postcode"
                    type="text"
                    required
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    placeholder="e.g. UB3 4NS"
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                  />
                  <button
                    type="button"
                    onClick={handleCheckPostcode}
                    disabled={isCheckingPostcode || !postcode.trim()}
                    className="shrink-0 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    {isCheckingPostcode ? "Checking..." : "Verify Distance"}
                  </button>
                </div>
              </div>
            </div>

            {/* Postcode Check Feedback Result */}
            {deliveryResult && (
              <div
                className={`mt-3 rounded-xl p-3.5 text-xs ${deliveryResult.isEligible
                  ? deliveryResult.isFreeDelivery
                    ? "border border-green-200 bg-green-50 text-green-900"
                    : "border border-blue-200 bg-blue-50 text-blue-900"
                  : "border border-red-200 bg-red-50 text-red-900"
                  }`}
              >
                <p className="font-semibold">
                  {deliveryResult.isEligible ? "✓ Delivery Available" : "✕ Delivery Unavailable"}
                </p>
                <p className="mt-0.5">{deliveryResult.reason}</p>
              </div>
            )}
          </div>
        </div>
      ) : fulfilmentType === "collection" ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
            3. Collection Details
          </h2>
          <div className="mt-4 rounded-xl bg-gray-50 p-4 text-xs text-gray-600 border border-gray-200 space-y-1">
            <p className="font-semibold text-gray-900">📍 Collection Shop Address:</p>
            <p>SIRAGRO Store, near UB3 4NS (Hayes, Middlesex)</p>
            <p className="mt-2 text-gray-500">
              Orders are typically ready for collection within 1 hour. Please bring your order confirmation email when collecting.
            </p>
          </div>
        </div>
      ) : null}

      {/* 4. Challenge 25 Age Verification Acknowledgment Gate (if basket has 18+ items) */}
      {summary.hasAgeRestrictedItems && (
        <div className="rounded-2xl border border-red-200 bg-red-50/70 p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
              18+
            </span>
            <h2 className="text-base font-bold text-red-900">
              Challenge 25 Age Verification Mandatory
            </h2>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-red-800">
            Your basket contains alcoholic or age-restricted items. In compliance with the Licensing Act 2003:
          </p>
          <ul className="mt-1 list-disc list-inside text-xs text-red-800 space-y-0.5">
            <li>You must be 18 years of age or older to purchase.</li>
            <li>A photographic ID check (Passport, Driving Licence, or PASS card) will be conducted upon delivery or collection.</li>
            <li>If valid ID cannot be presented, age-restricted items cannot be handed over.</li>
          </ul>

          <div className="mt-4 flex items-start gap-3">
            <input
              id="ageConfirmed"
              name="ageConfirmed"
              type="checkbox"
              value="true"
              required
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <label htmlFor="ageConfirmed" className="text-xs font-semibold text-gray-900">
              I confirm that I am 18 years of age or older and agree to present valid photographic ID upon delivery or collection. *
            </label>
          </div>
        </div>
      )}

      {/* 5. Order Total & Stripe Submit */}
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-3">
          Order Summary &amp; Payment
        </h2>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Groceries Subtotal</span>
            <span className="font-semibold text-gray-900">£{summary.subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span>
              {fulfilmentType === "delivery"
                ? "Home Delivery"
                : fulfilmentType === "collection"
                  ? "In-Store Collection"
                  : "Fulfilment"}
            </span>
            <span className="font-semibold text-gray-900">
              {!fulfilmentType
                ? "Unavailable"
                : currentDeliveryFee === 0
                  ? "FREE"
                  : `£${currentDeliveryFee.toFixed(2)}`}
            </span>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-3 flex justify-between items-baseline">
          <span className="text-base font-bold text-gray-900">Total to Pay</span>
          <span className="text-3xl font-extrabold text-gray-900">
            £{totalAmount.toFixed(2)}
          </span>
        </div>

        <button
          type="submit"
          disabled={
            isSubmitting ||
            !fulfilmentType ||
            (fulfilmentType === "delivery" && !availability.deliveryAvailable) ||
            (fulfilmentType === "collection" && !availability.collectionAvailable)
          }
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#323C4B] hover:bg-[#242c37] px-6 py-4 text-base font-bold text-white shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
        >
          {isSubmitting ? (
            "Connecting to Stripe..."
          ) : (
            `Pay £${totalAmount.toFixed(2)} with Stripe Card Payment 🔒`
          )}
        </button>

        <p className="text-center text-[11px] text-gray-500">
          You will be redirected to Stripe&apos;s encrypted checkout page. We never store or handle your credit or debit card details.
        </p>
      </div>
    </form>
  );
}


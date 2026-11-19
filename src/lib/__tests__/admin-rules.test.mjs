import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isAdminRole,
  isValidOrderTransition,
  calculateRevenueSummary,
  validateProductImageFile,
  classifyStockStatus,
  shouldGroupCartActivity,
  sanitizeAdminRedirect,
  normalizeProductPrice,
  isMissingSchemaError,
  isStripeSecretConfigured,
  isStripeWebhookConfigured,
  MAX_IMAGE_FILE_SIZE_BYTES,
} from "../admin-rules.ts";
import {
  evaluateDeliveryRules,
  evaluateFulfilmentAvailability,
} from "../delivery-rules.ts";
import { processCheckoutSubmission } from "../checkout-flow.ts";
import {
  addVerifiedGuestBasketItem,
  clearVerifiedGuestBasket,
  createInMemoryGuestBasketStore,
  createSignedGuestToken,
  getGuestSigningSecret,
  isStrongGuestSecret,
  readVerifiedGuestBasket,
  requireGuestSigningSecret,
  signGuestToken,
  updateVerifiedGuestBasketQuantity,
  verifySignedGuestToken,
} from "../guest-basket.ts";
import {
  getNextAttemptCount,
  isEmailProviderConfigured,
  resolveNotificationRecord,
} from "../email-status.ts";
import { validatePaidGbpStripeSession } from "../stripe-rules.ts";
import {
  createAdminSessionToken,
  verifyAdminSessionToken,
  ADMIN_SESSION_COOKIE_NAME,
  getAdminSessionCookieOptions,
  getClearAdminSessionCookieOptions,
} from "../admin-session.ts";

describe("Admin Authorization Rules", () => {
  it("grants admin access strictly to role === 'admin'", () => {
    assert.equal(isAdminRole("admin"), true);
    assert.equal(isAdminRole("customer"), false);
    assert.equal(isAdminRole("staff"), false);
    assert.equal(isAdminRole("ADMIN"), false);
    assert.equal(isAdminRole(null), false);
    assert.equal(isAdminRole(undefined), false);
    assert.equal(isAdminRole(""), false);
  });

  it("creates and verifies ephemeral admin session tokens", async () => {
    const token = await createAdminSessionToken("user-123", "admin@siragro.co.uk");
    assert.ok(token);
    assert.ok(token.includes("."));

    const verified = await verifyAdminSessionToken(token);
    assert.equal(verified.valid, true);
    assert.equal(verified.payload?.userId, "user-123");
    assert.equal(verified.payload?.email, "admin@siragro.co.uk");
    assert.equal(verified.payload?.role, "admin");

    // Rejects tampered token
    const tampered = token + "xyz";
    const invalidTampered = await verifyAdminSessionToken(tampered);
    assert.equal(invalidTampered.valid, false);

    // Rejects empty or malformed tokens
    assert.equal((await verifyAdminSessionToken("")).valid, false);
    assert.equal((await verifyAdminSessionToken(null)).valid, false);
    assert.equal((await verifyAdminSessionToken("invalid-format")).valid, false);

    // Rejects expired token
    const expiredResult = await verifyAdminSessionToken(token, -1000);
    assert.equal(expiredResult.valid, false);
  });

  it("enforces session-only cookie policies (no maxAge/expires on active session)", () => {
    const sessionOpts = getAdminSessionCookieOptions();
    assert.equal(sessionOpts.httpOnly, true);
    assert.equal(sessionOpts.sameSite, "lax");
    assert.equal(sessionOpts.path, "/");
    assert.equal("maxAge" in sessionOpts, false);
    assert.equal("expires" in sessionOpts, false);

    const clearOpts = getClearAdminSessionCookieOptions();
    assert.equal(clearOpts.maxAge, 0);
    assert.equal(clearOpts.expires.getTime(), 0);
  });
});

describe("Order Fulfilment Transition Rules", () => {
  it("enforces valid delivery workflow transitions", () => {
    assert.equal(isValidOrderTransition("delivery", "pending", "processing"), true);
    assert.equal(isValidOrderTransition("delivery", "processing", "out_for_delivery"), true);
    assert.equal(isValidOrderTransition("delivery", "out_for_delivery", "delivered"), true);

    assert.equal(isValidOrderTransition("delivery", "processing", "ready_for_pickup"), false);
    assert.equal(isValidOrderTransition("delivery", "processing", "delivered"), false);
    assert.equal(isValidOrderTransition("delivery", "delivered", "processing"), false);
    assert.equal(isValidOrderTransition("delivery", "cancelled", "processing"), false);
    assert.equal(isValidOrderTransition("delivery", "processing", "processing"), false);
  });

  it("enforces valid collection workflow transitions", () => {
    assert.equal(isValidOrderTransition("collection", "processing", "ready_for_pickup"), true);
    assert.equal(isValidOrderTransition("collection", "ready_for_pickup", "collected"), true);

    assert.equal(isValidOrderTransition("collection", "processing", "out_for_delivery"), false);
    assert.equal(isValidOrderTransition("collection", "collected", "processing"), false);
  });
});

describe("Revenue Calculation Rules", () => {
  const fixedNow = new Date("2026-11-17T12:00:00.000Z");

  const sampleOrders = [
    { total: 42.5, payment_status: "paid", created_at: "2026-11-17T09:00:00.000Z" },
    { total: 18.25, payment_status: "paid", created_at: "2026-11-14T15:00:00.000Z" },
    { total: 100.0, payment_status: "unpaid", created_at: "2026-11-17T10:00:00.000Z" },
    { total: 55.0, payment_status: "failed", created_at: "2026-11-17T11:00:00.000Z" },
    {
      total: 30.0,
      refunded_amount: 10.0,
      payment_status: "refunded",
      created_at: "2026-11-17T11:30:00.000Z",
    },
  ];

  it("excludes unpaid and failed payments and accounts for refunds", () => {
    const today = calculateRevenueSummary(sampleOrders, "today", fixedNow);
    assert.equal(today.paidOrderCount, 2);
    assert.equal(today.grossPaidRevenue, 72.5);
    assert.equal(today.refundedTotal, 10.0);
    assert.equal(today.netPaidRevenue, 62.5);
    assert.equal(today.hasRecordedRefunds, true);
    assert.equal(today.awaitingPaymentCount, 1);
    assert.equal(today.failedPaymentCount, 1);

    const all = calculateRevenueSummary(sampleOrders, "all", fixedNow);
    assert.equal(all.paidOrderCount, 3);
    assert.equal(all.grossPaidRevenue, 90.75);
    assert.equal(all.netPaidRevenue, 80.75);
  });
});

describe("Product Image, Stock & Cart Notification Rules", () => {
  it("validates allowed image types and maximum file size", () => {
    assert.equal(
      validateProductImageFile({ name: "apple.jpg", type: "image/jpeg", size: 1024 }).valid,
      true
    );
    assert.equal(
      validateProductImageFile({ name: "milk.png", type: "image/png", size: 2048 }).valid,
      true
    );
    assert.equal(
      validateProductImageFile({ name: "bread.webp", type: "image/webp", size: 2048 }).valid,
      true
    );
    assert.equal(
      validateProductImageFile({ name: "doc.pdf", type: "application/pdf", size: 1024 }).valid,
      false
    );
    assert.equal(
      validateProductImageFile({
        name: "huge.jpg",
        type: "image/jpeg",
        size: MAX_IMAGE_FILE_SIZE_BYTES + 1,
      }).valid,
      false
    );
  });

  it("classifies out-of-stock, low-stock, and in-stock accurately", () => {
    assert.equal(classifyStockStatus(0), "out_of_stock");
    assert.equal(classifyStockStatus(-1), "out_of_stock");
    assert.equal(classifyStockStatus(5), "low_stock");
    assert.equal(classifyStockStatus(10), "low_stock");
    assert.equal(classifyStockStatus(11), "in_stock");
  });

  it("groups rapid cart activity within the 15-minute throttle window", () => {
    const baseMs = Date.parse("2026-11-17T12:00:00.000Z");
    assert.equal(
      shouldGroupCartActivity("2026-11-17T11:50:00.000Z", baseMs, 15),
      true
    );
    assert.equal(
      shouldGroupCartActivity("2026-11-17T11:40:00.000Z", baseMs, 15),
      false
    );
  });
});

describe("Delivery Safety Rules (Fail Closed)", () => {
  const unconfirmedSettings = {
    shop_postcode: "UB3 4NS",
    free_delivery_radius_miles: 1.0,
    free_delivery_min_subtotal: 25.0,
    max_delivery_radius_miles: 5.0,
    delivery_fee_tier_1: 3.99,
    delivery_fee_tier_2: 4.99,
    distance_method: "haversine",
    is_delivery_enabled: true,
    is_collection_enabled: true,
    is_delivery_pricing_confirmed: false,
  };

  it("blocks both delivery and collection when settings cannot be read", () => {
    const availability = evaluateFulfilmentAvailability(null, true);
    assert.equal(availability.settingsLoaded, false);
    assert.equal(availability.deliveryAvailable, false);
    assert.equal(availability.collectionAvailable, false);

    const delivery = evaluateDeliveryRules({
      fulfilmentType: "delivery",
      postcodeProvided: true,
      distanceMiles: 0.4,
      subtotal: 40,
      settings: null,
      settingsError: true,
    });
    assert.equal(delivery.isEligible, false);

    const collection = evaluateDeliveryRules({
      fulfilmentType: "collection",
      postcodeProvided: false,
      distanceMiles: 0,
      subtotal: 40,
      settings: null,
      settingsError: true,
    });
    assert.equal(collection.isEligible, false);
  });

  it("prevents home delivery when pricing is unconfirmed while keeping enabled collection available", () => {
    const availability = evaluateFulfilmentAvailability(unconfirmedSettings, false);
    assert.equal(availability.deliveryAvailable, false);
    assert.equal(availability.collectionAvailable, true);
    assert.equal(availability.pricingConfirmed, false);

    const delivery = evaluateDeliveryRules({
      fulfilmentType: "delivery",
      postcodeProvided: true,
      distanceMiles: 0.5,
      subtotal: 40,
      settings: unconfirmedSettings,
    });
    assert.equal(delivery.isEligible, false);

    const collection = evaluateDeliveryRules({
      fulfilmentType: "collection",
      postcodeProvided: false,
      distanceMiles: 0,
      subtotal: 40,
      settings: unconfirmedSettings,
    });
    assert.equal(collection.isEligible, true);
    assert.equal(collection.deliveryFee, 0);
  });

  it("enforces is_delivery_enabled and is_collection_enabled toggles on the server", () => {
    const pausedSettings = {
      ...unconfirmedSettings,
      is_delivery_pricing_confirmed: true,
      is_delivery_enabled: false,
      is_collection_enabled: false,
    };

    const delivery = evaluateDeliveryRules({
      fulfilmentType: "delivery",
      postcodeProvided: true,
      distanceMiles: 0.5,
      subtotal: 40,
      settings: pausedSettings,
    });
    assert.equal(delivery.isEligible, false);

    const collection = evaluateDeliveryRules({
      fulfilmentType: "collection",
      postcodeProvided: false,
      distanceMiles: 0,
      subtotal: 40,
      settings: pausedSettings,
    });
    assert.equal(collection.isEligible, false);
  });

  it("never falls back to hardcoded fees when configured fees are missing or invalid", () => {
    const missingFeeSettings = {
      ...unconfirmedSettings,
      is_delivery_pricing_confirmed: true,
      delivery_fee_tier_1: null,
    };

    const res = evaluateDeliveryRules({
      fulfilmentType: "delivery",
      postcodeProvided: true,
      distanceMiles: 2.0,
      subtotal: 20,
      settings: missingFeeSettings,
    });
    assert.equal(res.isEligible, false);
    assert.equal(res.deliveryFee, 0);
  });

  it("enforces strictly > £25 free delivery and > 5 mile cutoff only after pricing confirmation", () => {
    const confirmedSettings = {
      ...unconfirmedSettings,
      is_delivery_pricing_confirmed: true,
      delivery_fee_tier_1: 2.5,
      delivery_fee_tier_2: 3.5,
    };

    // Exact £25.00 within 1 mile is NOT strictly above £25
    const exactTwentyFive = evaluateDeliveryRules({
      fulfilmentType: "delivery",
      postcodeProvided: true,
      distanceMiles: 0.8,
      subtotal: 25.0,
      settings: confirmedSettings,
    });
    assert.equal(exactTwentyFive.isEligible, true);
    assert.equal(exactTwentyFive.isFreeDelivery, false);
    assert.equal(exactTwentyFive.deliveryFee, 2.5);

    // £25.01 within 1 mile qualifies for free delivery
    const strictlyOver = evaluateDeliveryRules({
      fulfilmentType: "delivery",
      postcodeProvided: true,
      distanceMiles: 0.8,
      subtotal: 25.01,
      settings: confirmedSettings,
    });
    assert.equal(strictlyOver.isEligible, true);
    assert.equal(strictlyOver.isFreeDelivery, true);
    assert.equal(strictlyOver.deliveryFee, 0);

    // Outside 5 miles fails closed
    const outsideRadius = evaluateDeliveryRules({
      fulfilmentType: "delivery",
      postcodeProvided: true,
      distanceMiles: 5.01,
      subtotal: 50.0,
      settings: confirmedSettings,
    });
    assert.equal(outsideRadius.isEligible, false);
  });

  it("blocks home-delivery Stripe checkout when pricing is unconfirmed while allowing verified collection checkout", async () => {
    let stripeCallCount = 0;
    let lastStripeParams = null;

    const buildForm = (fulfilmentType) => {
      const fd = new FormData();
      fd.set("customerName", "Test Customer");
      fd.set("customerEmail", "customer@example.com");
      fd.set("customerPhone", "07700900000");
      fd.set("fulfilmentType", fulfilmentType);
      fd.set("addressLine1", "10 High Street");
      fd.set("city", "Hayes");
      fd.set("postcode", "UB3 4NS");
      // Simulated browser tampering attempts (must be ignored by server checkout)
      fd.set("deliveryFee", "0");
      fd.set("total", "0.01");
      return fd;
    };

    const makeDeps = (settings, settingsError = false) => ({
      getBasket: async () => ({
        items: [{ productId: "p-1", quantity: 2, lineTotal: 15.0 }],
        itemCount: 2,
        subtotal: 15.0,
        hasAgeRestrictedItems: false,
      }),
      calculateDeliveryCharge: async ({ fulfilmentType, postcode, subtotal }) =>
        evaluateDeliveryRules({
          fulfilmentType,
          postcodeProvided: Boolean(postcode && postcode.trim()),
          distanceMiles: fulfilmentType === "collection" ? 0 : 0.4,
          subtotal,
          settings,
          settingsError,
        }),
      getProfileId: async () => null,
      createStripeCheckoutSession: async (params) => {
        stripeCallCount += 1;
        lastStripeParams = params;
        return { id: "cs_test_123", url: "https://checkout.stripe.test/session" };
      },
    });

    // 1. Delivery pricing unconfirmed + collection enabled:
    //    - delivery rejected with 0 Stripe sessions created
    //    - collection succeeds with server deliveryFee === 0
    const deliveryRes = await processCheckoutSubmission(
      buildForm("delivery"),
      makeDeps(unconfirmedSettings)
    );
    assert.ok(deliveryRes.error);
    assert.equal(deliveryRes.url, undefined);
    assert.equal(stripeCallCount, 0);

    const collectionRes = await processCheckoutSubmission(
      buildForm("collection"),
      makeDeps(unconfirmedSettings)
    );
    assert.equal(collectionRes.error, undefined);
    assert.equal(collectionRes.url, "https://checkout.stripe.test/session");
    assert.equal(stripeCallCount, 1);
    assert.equal(lastStripeParams.deliveryFee, 0);

    // 2. Collection disabled: collection blocked via server action and 0 Stripe sessions created
    const callsBeforeDisabledCollection = stripeCallCount;
    const disabledCollectionRes = await processCheckoutSubmission(
      buildForm("collection"),
      makeDeps({ ...unconfirmedSettings, is_collection_enabled: false })
    );
    assert.ok(disabledCollectionRes.error);
    assert.equal(stripeCallCount, callsBeforeDisabledCollection);

    // 3. Settings cannot be verified (query error or non-boolean collection flag): blocked & 0 Stripe sessions
    const callsBeforeSettingsErr = stripeCallCount;
    const settingsErrCollection = await processCheckoutSubmission(
      buildForm("collection"),
      makeDeps(null, true)
    );
    const nonBooleanCollection = await processCheckoutSubmission(
      buildForm("collection"),
      makeDeps({ ...unconfirmedSettings, is_collection_enabled: null })
    );
    assert.ok(settingsErrCollection.error);
    assert.ok(nonBooleanCollection.error);
    assert.equal(stripeCallCount, callsBeforeSettingsErr);
  });
});

describe("Guest Basket Session Isolation & Signature Security", () => {
  const validSecret = "unit-check-9f8e7d6c5b4a39281726354455667788";

  it("isolates two separate guest sessions and blocks forged or unsigned token reuse", async () => {
    const store = createInMemoryGuestBasketStore();

    // Session A adds product A1 (qty 2)
    const sessionARes = await addVerifiedGuestBasketItem({
      cookieValue: undefined,
      secret: validSecret,
      store,
      productId: "11111111-1111-4111-8111-111111111111",
      quantity: 2,
    });
    assert.equal(sessionARes.ok, true);
    assert.ok(sessionARes.ok && sessionARes.newSignedCookie);
    const cookieA = sessionARes.ok ? sessionARes.newSignedCookie : "";
    const tokenIdA = sessionARes.ok ? sessionARes.tokenId : "";

    // Session B adds product B1 (qty 3)
    const sessionBRes = await addVerifiedGuestBasketItem({
      cookieValue: undefined,
      secret: validSecret,
      store,
      productId: "22222222-2222-4222-8222-222222222222",
      quantity: 3,
    });
    assert.equal(sessionBRes.ok, true);
    assert.ok(sessionBRes.ok && sessionBRes.newSignedCookie);
    const cookieB = sessionBRes.ok ? sessionBRes.newSignedCookie : "";
    const tokenIdB = sessionBRes.ok ? sessionBRes.tokenId : "";

    assert.notEqual(tokenIdA, tokenIdB);

    // Verify each session reads only its own basket
    const readA = await readVerifiedGuestBasket(cookieA, validSecret, store);
    const readB = await readVerifiedGuestBasket(cookieB, validSecret, store);
    assert.equal(readA.ok, true);
    assert.equal(readB.ok, true);
    assert.deepEqual(readA.ok ? readA.items : [], [
      { productId: "11111111-1111-4111-8111-111111111111", quantity: 2 },
    ]);
    assert.deepEqual(readB.ok ? readB.items : [], [
      { productId: "22222222-2222-4222-8222-222222222222", quantity: 3 },
    ]);

    // Session B tries to replay Session A's raw UUID (unsigned) or a forged signature
    const tamperedCookie = `${tokenIdA}.forgedsignaturevalue`;
    assert.equal(verifySignedGuestToken(tokenIdA, validSecret), null);
    assert.equal(verifySignedGuestToken(tamperedCookie, validSecret), null);

    const readUnsigned = await readVerifiedGuestBasket(tokenIdA, validSecret, store);
    const readTampered = await readVerifiedGuestBasket(tamperedCookie, validSecret, store);
    assert.equal(readUnsigned.ok, false);
    assert.equal(readTampered.ok, false);

    const forgedUpdate = await updateVerifiedGuestBasketQuantity({
      cookieValue: tamperedCookie,
      secret: validSecret,
      store,
      productId: "11111111-1111-4111-8111-111111111111",
      quantity: 99,
    });
    assert.equal(forgedUpdate.ok, false);

    const forgedClear = await clearVerifiedGuestBasket({
      cookieValue: tokenIdA,
      secret: validSecret,
      store,
    });
    assert.equal(forgedClear.ok, false);

    // Clearing Session B does not affect Session A
    const clearB = await clearVerifiedGuestBasket({
      cookieValue: cookieB,
      secret: validSecret,
      store,
    });
    assert.equal(clearB.ok, true);

    const afterB = await readVerifiedGuestBasket(cookieB, validSecret, store);
    const stillIntactA = await readVerifiedGuestBasket(cookieA, validSecret, store);
    assert.deepEqual(afterB.ok ? afterB.items : null, []);
    assert.deepEqual(stillIntactA.ok ? stillIntactA.items : null, [
      { productId: "11111111-1111-4111-8111-111111111111", quantity: 2 },
    ]);
  });

  it("requires a dedicated strong GUEST_SESSION_SECRET and refuses silent fallbacks", async () => {
    // Even if SUPABASE_SERVICE_ROLE_KEY and STRIPE_SECRET_KEY are set, missing GUEST_SESSION_SECRET must fail
    const missingEnvCheck = requireGuestSigningSecret({
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key-0123456789abcdef0123456789",
      STRIPE_SECRET_KEY: "sk_test_0123456789abcdef0123456789abcdef",
    });
    assert.equal(missingEnvCheck.ok, false);
    assert.equal(
      getGuestSigningSecret({
        SUPABASE_SERVICE_ROLE_KEY: "service-role-key-0123456789abcdef0123456789",
        STRIPE_SECRET_KEY: "sk_test_0123456789abcdef0123456789abcdef",
      }),
      null
    );

    // Weak, short, repeated-char, and placeholder secrets must all be rejected
    assert.equal(isStrongGuestSecret("too-short"), false);
    assert.equal(isStrongGuestSecret("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"), false);
    assert.equal(
      isStrongGuestSecret("replace-with-a-random-32-char-plus-guest-session-secret"),
      false
    );

    // Configured dedicated secret succeeds
    const validEnvCheck = requireGuestSigningSecret({
      GUEST_SESSION_SECRET: validSecret,
    });
    assert.equal(validEnvCheck.ok, true);

    // Guest basket helpers return a safe configuration error when secret is missing
    const store = createInMemoryGuestBasketStore();
    const { signedCookieValue, tokenId } = createSignedGuestToken(validSecret);
    assert.equal(verifySignedGuestToken(signedCookieValue, validSecret), tokenId);

    const addMissing = await addVerifiedGuestBasketItem({
      cookieValue: undefined,
      secret: undefined,
      store,
      productId: "11111111-1111-4111-8111-111111111111",
      quantity: 1,
    });
    assert.equal(addMissing.ok, false);
    assert.equal(addMissing.code, "CONFIG_ERROR");

    const readMissing = await readVerifiedGuestBasket(signedCookieValue, undefined, store);
    assert.equal(readMissing.ok, false);
    assert.equal(readMissing.code, "CONFIG_ERROR");

    // Verify invalid / tampered token is rejected cleanly even with valid secret
    assert.equal(verifySignedGuestToken(signedCookieValue, "other-secret-value-0123456789abcdef012345"), null);
    assert.throws(() => signGuestToken(tokenId, "short"));
  });
});

describe("Email Notification Status & Stripe Currency Checks", () => {
  it("never reports missing or placeholder email providers as sent and tracks attempts", () => {
    assert.equal(isEmailProviderConfigured(undefined), false);
    assert.equal(isEmailProviderConfigured(""), false);
    assert.equal(isEmailProviderConfigured("re_your-resend-api-key"), false);
    assert.equal(isEmailProviderConfigured("re_live_example_key"), true);

    const unconfigured = resolveNotificationRecord({
      success: false,
      notConfigured: true,
      error: "RESEND_API_KEY missing",
    });
    assert.equal(unconfigured.send_status, "not_configured");
    assert.equal(unconfigured.sent_at, null);

    const failed = resolveNotificationRecord({
      success: false,
      error: "SMTP error",
    });
    assert.equal(failed.send_status, "failed");
    assert.equal(failed.sent_at, null);

    assert.equal(getNextAttemptCount(undefined), 1);
    assert.equal(getNextAttemptCount(1), 2);
    assert.equal(getNextAttemptCount(2), 3);
  });

  it("accepts only settled GBP Stripe Checkout sessions", () => {
    assert.equal(
      validatePaidGbpStripeSession({
        payment_status: "paid",
        currency: "GBP",
        amount_total: 2599,
      }).valid,
      true
    );

    assert.equal(
      validatePaidGbpStripeSession({
        payment_status: "paid",
        currency: "usd",
        amount_total: 2599,
      }).valid,
      false
    );

    assert.equal(
      validatePaidGbpStripeSession({
        payment_status: "unpaid",
        currency: "gbp",
        amount_total: 2599,
      }).valid,
      false
    );
  });

  it("restricts admin login redirects strictly to internal /admin paths", () => {
    assert.equal(sanitizeAdminRedirect("/admin"), "/admin");
    assert.equal(
      sanitizeAdminRedirect("/admin/orders?view=completed"),
      "/admin/orders?view=completed"
    );
    assert.equal(sanitizeAdminRedirect("/admin/login"), "/admin");
    assert.equal(sanitizeAdminRedirect("//evil.example/admin"), "/admin");
    assert.equal(sanitizeAdminRedirect("https://evil.example/admin"), "/admin");
    assert.equal(sanitizeAdminRedirect("/account"), "/admin");
    assert.equal(sanitizeAdminRedirect(null), "/admin");
  });

  it("validates quick GBP product price updates and gateway readiness flags", () => {
    assert.equal(normalizeProductPrice("4.995"), 5);
    assert.equal(normalizeProductPrice(2.5), 2.5);
    assert.equal(normalizeProductPrice(0), 0);
    assert.equal(normalizeProductPrice("-1"), null);
    assert.equal(normalizeProductPrice("abc"), null);

    assert.equal(isMissingSchemaError("column orders.refunded_amount does not exist"), true);
    assert.equal(isMissingSchemaError("timeout connecting to host"), false);

    assert.equal(isStripeSecretConfigured("sk_test_your-stripe-secret-key"), false);
    assert.equal(isStripeSecretConfigured("sk_test_51ExampleKey"), true);
    assert.equal(isStripeWebhookConfigured("whsec_your-stripe-webhook-secret"), false);
    assert.equal(isStripeWebhookConfigured("whsec_ExampleSecret"), true);
  });
});

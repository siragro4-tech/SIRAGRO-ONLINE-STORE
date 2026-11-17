import crypto from "node:crypto";

export const GUEST_TOKEN_UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const MIN_GUEST_SESSION_SECRET_LENGTH = 32;
const MIN_GUEST_SECRET_UNIQUE_CHARS = 10;

export const GUEST_SECRET_CONFIG_ERROR =
  "Guest shopping basket sessions are unavailable because a dedicated strong GUEST_SESSION_SECRET (32+ characters) is not configured. Please sign in or contact store support.";

export type GuestBasketLineItem = {
  productId: string;
  quantity: number;
};

export interface GuestBasketStore {
  findBasketIdByGuestToken(guestTokenId: string): Promise<string | null>;
  createBasketForGuestToken(guestTokenId: string): Promise<string | null>;
  listItems(basketId: string): Promise<GuestBasketLineItem[]>;
  addOrIncrementItem(
    basketId: string,
    productId: string,
    quantity: number
  ): Promise<void>;
  setItemQuantity(
    basketId: string,
    productId: string,
    quantity: number
  ): Promise<void>;
  clearItems(basketId: string): Promise<void>;
}

const WEAK_PLACEHOLDER_PATTERNS = [
  "your-guest-session-secret",
  "your-secret",
  "your-service-role",
  "replace-with",
  "placeholder",
  "changeme",
  "change-me",
  "example",
  "dummy",
];

/**
 * Validates that a candidate guest session secret meets minimum length and entropy
 * requirements and is not an obvious placeholder value.
 */
export function isStrongGuestSecret(
  value: string | null | undefined
): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length < MIN_GUEST_SESSION_SECRET_LENGTH) {
    return false;
  }

  const lower = trimmed.toLowerCase();
  for (const pattern of WEAK_PLACEHOLDER_PATTERNS) {
    if (lower.includes(pattern)) {
      return false;
    }
  }

  // Reject low-entropy repeated character strings such as "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  if (new Set(trimmed).size < MIN_GUEST_SECRET_UNIQUE_CHARS) {
    return false;
  }

  return true;
}

/**
 * Resolves the dedicated GUEST_SESSION_SECRET without silent fallbacks to
 * SUPABASE_SERVICE_ROLE_KEY or STRIPE_SECRET_KEY. Never logs secret values.
 */
export function requireGuestSigningSecret(
  env: Record<string, string | undefined> = process.env
): { ok: true; secret: string } | { ok: false; error: string } {
  const rawSecret = env.GUEST_SESSION_SECRET;
  if (!isStrongGuestSecret(rawSecret)) {
    return {
      ok: false,
      error: GUEST_SECRET_CONFIG_ERROR,
    };
  }
  return {
    ok: true,
    secret: rawSecret.trim(),
  };
}

/**
 * Convenience accessor returning only the validated dedicated GUEST_SESSION_SECRET, or null.
 */
export function getGuestSigningSecret(
  env: Record<string, string | undefined> = process.env
): string | null {
  const check = requireGuestSigningSecret(env);
  return check.ok ? check.secret : null;
}

/**
 * Signs a verified UUID guest token using HMAC-SHA256 with a dedicated strong secret.
 */
export function signGuestToken(tokenId: string, secret: string): string {
  if (!GUEST_TOKEN_UUID_REGEX.test(tokenId)) {
    throw new Error("Invalid guest token UUID format.");
  }
  if (!isStrongGuestSecret(secret)) {
    throw new Error(GUEST_SECRET_CONFIG_ERROR);
  }

  const normalizedId = tokenId.toLowerCase();
  const signature = crypto
    .createHmac("sha256", secret.trim())
    .update(normalizedId)
    .digest("base64url");

  return `${normalizedId}.${signature}`;
}

/**
 * Generates a brand-new CSPRNG UUID guest token + HMAC signature.
 */
export function createSignedGuestToken(secret: string): {
  tokenId: string;
  signedCookieValue: string;
} {
  if (!isStrongGuestSecret(secret)) {
    throw new Error(GUEST_SECRET_CONFIG_ERROR);
  }
  const tokenId = crypto.randomUUID().toLowerCase();
  return {
    tokenId,
    signedCookieValue: signGuestToken(tokenId, secret),
  };
}

/**
 * Constant-time HMAC verification for guest session cookies.
 * Rejects missing/weak secrets, unsigned UUIDs, tampered cookies, and forged signatures.
 */
export function verifySignedGuestToken(
  signedValue: string | null | undefined,
  secret: string | null | undefined
): string | null {
  if (!signedValue || !isStrongGuestSecret(secret)) {
    return null;
  }

  const dotIndex = signedValue.indexOf(".");
  if (dotIndex <= 0 || dotIndex === signedValue.length - 1) {
    return null;
  }

  // Ensure strictly two parts: <uuid>.<signature>
  if (signedValue.indexOf(".", dotIndex + 1) !== -1) {
    return null;
  }

  const tokenId = signedValue.slice(0, dotIndex);
  const providedSig = signedValue.slice(dotIndex + 1);

  if (!GUEST_TOKEN_UUID_REGEX.test(tokenId)) {
    return null;
  }

  const expectedSigned = signGuestToken(tokenId, secret);
  const expectedSig = expectedSigned.slice(tokenId.length + 1);

  const providedBuf = Buffer.from(providedSig, "utf8");
  const expectedBuf = Buffer.from(expectedSig, "utf8");

  if (providedBuf.length !== expectedBuf.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(providedBuf, expectedBuf)) {
    return null;
  }

  return tokenId.toLowerCase();
}

export type GuestBasketReadResult =
  | { ok: true; tokenId: string; items: GuestBasketLineItem[] }
  | { ok: false; code: "CONFIG_ERROR" | "INVALID_TOKEN"; error: string };

/**
 * Reads guest basket items strictly for a cryptographically verified session cookie
 * using a dedicated strong secret.
 */
export async function readVerifiedGuestBasket(
  cookieValue: string | null | undefined,
  secret: string | null | undefined,
  store: GuestBasketStore
): Promise<GuestBasketReadResult> {
  if (!isStrongGuestSecret(secret)) {
    return {
      ok: false,
      code: "CONFIG_ERROR",
      error: GUEST_SECRET_CONFIG_ERROR,
    };
  }

  const tokenId = verifySignedGuestToken(cookieValue, secret);
  if (!tokenId) {
    return {
      ok: false,
      code: "INVALID_TOKEN",
      error: "Guest session token is missing or invalid.",
    };
  }

  const basketId = await store.findBasketIdByGuestToken(tokenId);
  if (!basketId) {
    return { ok: true, tokenId, items: [] };
  }

  const items = await store.listItems(basketId);
  return { ok: true, tokenId, items };
}

export type GuestBasketAddResult =
  | { ok: true; tokenId: string; newSignedCookie?: string }
  | { ok: false; code: "CONFIG_ERROR"; error: string };

/**
 * Adds/increments an item strictly within the caller's verified guest basket session.
 * Fails with a safe config error if secret is missing/weak.
 */
export async function addVerifiedGuestBasketItem(options: {
  cookieValue: string | null | undefined;
  secret: string | null | undefined;
  store: GuestBasketStore;
  productId: string;
  quantity: number;
}): Promise<GuestBasketAddResult> {
  const { cookieValue, secret, store, productId, quantity } = options;

  if (!isStrongGuestSecret(secret)) {
    return {
      ok: false,
      code: "CONFIG_ERROR",
      error: GUEST_SECRET_CONFIG_ERROR,
    };
  }

  let tokenId = verifySignedGuestToken(cookieValue, secret);
  let newSignedCookie: string | undefined;

  if (!tokenId) {
    const created = createSignedGuestToken(secret);
    tokenId = created.tokenId;
    newSignedCookie = created.signedCookieValue;
  }

  let basketId = await store.findBasketIdByGuestToken(tokenId);
  if (!basketId) {
    basketId = await store.createBasketForGuestToken(tokenId);
  }

  if (basketId && quantity > 0) {
    await store.addOrIncrementItem(basketId, productId, quantity);
  }

  return { ok: true, tokenId, newSignedCookie };
}

export type GuestBasketMutationResult =
  | { ok: true; tokenId: string }
  | {
      ok: false;
      code: "CONFIG_ERROR" | "INVALID_TOKEN" | "NOT_FOUND";
      error: string;
    };

/**
 * Updates item quantity strictly within the caller's verified guest basket session.
 */
export async function updateVerifiedGuestBasketQuantity(options: {
  cookieValue: string | null | undefined;
  secret: string | null | undefined;
  store: GuestBasketStore;
  productId: string;
  quantity: number;
}): Promise<GuestBasketMutationResult> {
  const { cookieValue, secret, store, productId, quantity } = options;

  if (!isStrongGuestSecret(secret)) {
    return {
      ok: false,
      code: "CONFIG_ERROR",
      error: GUEST_SECRET_CONFIG_ERROR,
    };
  }

  const tokenId = verifySignedGuestToken(cookieValue, secret);
  if (!tokenId) {
    return {
      ok: false,
      code: "INVALID_TOKEN",
      error: "Guest session token is missing or invalid.",
    };
  }

  const basketId = await store.findBasketIdByGuestToken(tokenId);
  if (!basketId) {
    return {
      ok: false,
      code: "NOT_FOUND",
      error: "Guest basket session not found.",
    };
  }

  await store.setItemQuantity(basketId, productId, quantity);
  return { ok: true, tokenId };
}

/**
 * Clears items strictly within the caller's verified guest basket session.
 */
export async function clearVerifiedGuestBasket(options: {
  cookieValue: string | null | undefined;
  secret: string | null | undefined;
  store: GuestBasketStore;
}): Promise<GuestBasketMutationResult> {
  const { cookieValue, secret, store } = options;

  if (!isStrongGuestSecret(secret)) {
    return {
      ok: false,
      code: "CONFIG_ERROR",
      error: GUEST_SECRET_CONFIG_ERROR,
    };
  }

  const tokenId = verifySignedGuestToken(cookieValue, secret);
  if (!tokenId) {
    return {
      ok: false,
      code: "INVALID_TOKEN",
      error: "Guest session token is missing or invalid.",
    };
  }

  const basketId = await store.findBasketIdByGuestToken(tokenId);
  if (!basketId) {
    return {
      ok: false,
      code: "NOT_FOUND",
      error: "Guest basket session not found.",
    };
  }

  await store.clearItems(basketId);
  return { ok: true, tokenId };
}

/**
 * Deterministic in-memory GuestBasketStore implementation for automated tests.
 */
export function createInMemoryGuestBasketStore(): GuestBasketStore {
  const basketsByToken = new Map<string, string>();
  const itemsByBasket = new Map<string, Map<string, number>>();
  let nextId = 1;

  return {
    async findBasketIdByGuestToken(guestTokenId) {
      return basketsByToken.get(guestTokenId) ?? null;
    },
    async createBasketForGuestToken(guestTokenId) {
      const existing = basketsByToken.get(guestTokenId);
      if (existing) return existing;
      const basketId = `basket-${nextId++}`;
      basketsByToken.set(guestTokenId, basketId);
      itemsByBasket.set(basketId, new Map());
      return basketId;
    },
    async listItems(basketId) {
      const map = itemsByBasket.get(basketId);
      if (!map) return [];
      return Array.from(map.entries()).map(([productId, quantity]) => ({
        productId,
        quantity,
      }));
    },
    async addOrIncrementItem(basketId, productId, quantity) {
      const map = itemsByBasket.get(basketId);
      if (!map) return;
      map.set(productId, (map.get(productId) || 0) + quantity);
    },
    async setItemQuantity(basketId, productId, quantity) {
      const map = itemsByBasket.get(basketId);
      if (!map) return;
      if (quantity <= 0) {
        map.delete(productId);
      } else {
        map.set(productId, quantity);
      }
    },
    async clearItems(basketId) {
      const map = itemsByBasket.get(basketId);
      if (!map) return;
      map.clear();
    },
  };
}

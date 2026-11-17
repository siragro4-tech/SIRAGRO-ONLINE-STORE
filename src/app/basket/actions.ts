"use server";

import { revalidatePath } from "next/cache";
import {
  addToBasket,
  updateBasketQuantity,
  removeFromBasket,
  clearBasket,
  getBasket,
} from "@/lib/basket";
import { recordServerCartActivity } from "@/lib/activity";

export async function addBasketItemAction(productId: string, quantity: number = 1) {
  const safeQuantity = Math.max(1, Math.min(20, Math.floor(Number(quantity) || 1)));
  const mutation = await addToBasket(productId, safeQuantity);
  revalidatePath("/", "layout");

  const summary = await getBasket();
  if (!mutation.success) {
    return {
      ...summary,
      error: mutation.error || summary.error,
    };
  }

  const matched = summary.items.find((item) => item.productId === productId);
  if (matched) {
    // Server-validated product ID, name, and clamped quantity only (no PII, no email)
    await recordServerCartActivity(
      matched.productId,
      matched.product.name,
      Math.min(safeQuantity, matched.quantity)
    );
  }

  return summary;
}

export async function updateBasketItemQuantityAction(productId: string, quantity: number) {
  const mutation = await updateBasketQuantity(productId, quantity);
  revalidatePath("/", "layout");
  const summary = await getBasket();
  return mutation.success
    ? summary
    : { ...summary, error: mutation.error || summary.error };
}

export async function removeBasketItemAction(productId: string) {
  const mutation = await removeFromBasket(productId);
  revalidatePath("/", "layout");
  const summary = await getBasket();
  return mutation.success
    ? summary
    : { ...summary, error: mutation.error || summary.error };
}

export async function clearBasketAction() {
  const mutation = await clearBasket();
  revalidatePath("/", "layout");
  const summary = await getBasket();
  return mutation.success
    ? summary
    : { ...summary, error: mutation.error || summary.error };
}


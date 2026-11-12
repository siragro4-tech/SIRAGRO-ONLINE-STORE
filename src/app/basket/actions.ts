"use server";

import { revalidatePath } from "next/cache";
import {
  addToBasket,
  updateBasketQuantity,
  removeFromBasket,
  clearBasket,
  getBasket,
} from "@/lib/basket";

export async function addBasketItemAction(productId: string, quantity: number = 1) {
  await addToBasket(productId, quantity);
  revalidatePath("/", "layout");
  return await getBasket();
}

export async function updateBasketItemQuantityAction(productId: string, quantity: number) {
  await updateBasketQuantity(productId, quantity);
  revalidatePath("/", "layout");
  return await getBasket();
}

export async function removeBasketItemAction(productId: string) {
  await removeFromBasket(productId);
  revalidatePath("/", "layout");
  return await getBasket();
}

export async function clearBasketAction() {
  await clearBasket();
  revalidatePath("/", "layout");
  return await getBasket();
}


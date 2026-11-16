"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { clearBasketAction } from "@/app/basket/actions";

interface OrderConfirmationEffectsProps {
  isConfirmed: boolean;
  hasSessionId: boolean;
}

export function OrderConfirmationEffects({
  isConfirmed,
  hasSessionId,
}: OrderConfirmationEffectsProps) {
  const router = useRouter();
  const clearedRef = useRef(false);

  useEffect(() => {
    if (isConfirmed && !clearedRef.current) {
      clearedRef.current = true;
      clearBasketAction()
        .then(() => router.refresh())
        .catch(() => {});
      return;
    }

    if (!isConfirmed && hasSessionId) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts += 1;
        router.refresh();
        if (attempts >= 6) {
          clearInterval(interval);
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isConfirmed, hasSessionId, router]);

  return null;
}


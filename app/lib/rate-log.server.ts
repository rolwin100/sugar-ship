import type { Prisma } from "@prisma/client";
import db from "../db.server";
import type { RateAddress, RateItem, RateOutcome, ShippingRate } from "./types";

type RateLogInput = {
  shopId: string;
  currency: string;
  locale?: string;
  destination?: RateAddress;
  items?: RateItem[];
  rates: ShippingRate[];
  outcome: RateOutcome;
  testMode: boolean;
  durationMs: number;
  error?: string;
};

// Only what we need for debugging: no customer name or street address.
function safeDestination(destination: RateAddress | undefined) {
  return {
    country: destination?.country ?? null,
    province: destination?.province ?? null,
    city: destination?.city ?? null,
    postal_code: destination?.postal_code ?? null,
  };
}

function safeItems(items: RateItem[] | undefined) {
  return (items ?? []).map((item) => ({
    name: item.name ?? null,
    sku: item.sku ?? null,
    quantity: item.quantity ?? null,
    grams: item.grams ?? null,
    price: item.price ?? null,
    product_id: item.product_id ?? null,
    variant_id: item.variant_id ?? null,
  }));
}

/** Writes one RateLog row. Callers should not await it on the checkout path. */
export async function logRateRequest(input: RateLogInput) {
  await db.rateLog.create({
    data: {
      shopId: input.shopId,
      currency: input.currency,
      locale: input.locale,
      destination: safeDestination(input.destination),
      items: safeItems(input.items) as Prisma.InputJsonValue,
      rates: input.rates as unknown as Prisma.InputJsonValue,
      outcome: input.outcome,
      testMode: input.testMode,
      durationMs: input.durationMs,
      error: input.error,
    },
  });
}

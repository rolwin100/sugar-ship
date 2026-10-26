import { createHmac, timingSafeEqual } from "node:crypto";
import type { RateAddress, RateRequest, ShippingRate } from "../types";

// Phase 1, step 1: one fixed rate, only in test mode.
const TEST_MODE_KEYWORD = "sugarship";
const FIXED_RATE_SUBUNITS = 5000; // 50.00 in the shop's currency

export function isValidHmac(rawBody: string, header: string): boolean {
  const secret = process.env.SHOPIFY_API_SECRET ?? "";
  if (!header || !secret) return false;
  const digest = createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");
  const a = Buffer.from(digest);
  const b = Buffer.from(header);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Test mode: rates only show when "sugarship" appears in the checkout name or address lines.
// (Shopify may send name as null for API-created carrier services, so address lines also work.)
export function isTestCheckout(destination: RateAddress | undefined): boolean {
  const fields = [
    destination?.name,
    destination?.address1,
    destination?.address2,
  ];
  return fields.some((value) =>
    value?.toLowerCase().includes(TEST_MODE_KEYWORD),
  );
}

export function quoteRates(payload: RateRequest): ShippingRate[] {
  const destination = payload.rate?.destination;
  const currency = payload.rate?.currency ?? "USD";

  if (!isTestCheckout(destination)) {
    return [];
  }

  return [
    {
      service_name: "Standard Shipping",
      service_code: "sugar_ship_standard",
      description: "Sugar Ship test rate",
      total_price: String(FIXED_RATE_SUBUNITS),
      currency,
    },
  ];
}

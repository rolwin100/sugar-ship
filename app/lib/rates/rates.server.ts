import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  FallbackSettings,
  RateAddress,
  RateRequest,
  ShippingRate,
} from "../types";

// Phase 1, step 1: one fixed rate, only in test mode.
const TEST_MODE_KEYWORD = "sugarship";
const FIXED_RATE_SUBUNITS = 5000; // 50.00 in the shop's currency
const FALLBACK_TEST_KEYWORD = "sugarship-fallback";

function addressContains(
  destination: RateAddress | undefined,
  keyword: string,
): boolean {
  return [destination?.name, destination?.address1, destination?.address2].some(
    (value) => typeof value === "string" && value.toLowerCase().includes(keyword),
  );
}

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
  console.log("[sugar-ship] rates: destination", JSON.stringify(destination));
  return fields.some(
    (value) =>
      typeof value === "string" &&
      value?.toLowerCase().includes(TEST_MODE_KEYWORD),
  );
}

export function quoteRates(payload: RateRequest): ShippingRate[] {
  const destination = payload.rate?.destination;
  const currency = payload.rate?.currency ?? "USD";

  if (!isTestCheckout(destination)) {
    return [];
  }

  // Dev-only: "sugarship-fallback" in the address simulates "no rule matched",
  // so the fallback rate can be tested. Removed when the engine lands (step 2.14).
  if (addressContains(destination, FALLBACK_TEST_KEYWORD)) {
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

/** Picks the buyer's language from a { en, fr, de } map, falling back to English. */
export function pickLocalized(
  value: unknown,
  locale: string | undefined,
): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const map = value as Record<string, unknown>;
  const language = (locale ?? "en").toLowerCase().split("-")[0];
  const text = map[language] ?? map.en;
  return typeof text === "string" && text.length > 0 ? text : undefined;
}

/**
 * The shop's fallback rate, or [] when it's off or can't be priced correctly.
 * The price is in the shop's currency, so we skip it for checkouts in another currency.
 */
export function fallbackRates(
  settings: FallbackSettings | null | undefined,
  shopCurrency: string | null | undefined,
  checkoutCurrency: string,
  locale: string | undefined,
): ShippingRate[] {
  if (!settings?.fallbackEnabled) return [];
  if (!shopCurrency || shopCurrency !== checkoutCurrency) return [];

  return [
    {
      service_name:
        pickLocalized(settings.fallbackName, locale) ?? "Standard Shipping",
      service_code: "sugar_ship_fallback",
      description: pickLocalized(settings.fallbackDescription, locale) ?? "",
      total_price: String(settings.fallbackPrice),
      currency: checkoutCurrency,
    },
  ];
}

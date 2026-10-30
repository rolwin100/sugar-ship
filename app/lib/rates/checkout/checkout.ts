import type { EngineCart, QuotedRate } from "../../engine";
import { translatorFor } from "../../i18n";
import { PRESET_KEYS } from "../../rules/presets";
import type { RatePreset } from "../../rules/types";
import type { RateRequest, ShippingRate } from "../../types";

// Pure conversions between Shopify's carrier-service format and our engine's.

/** Shopify's rate request → the engine's cart. */
export function toEngineCart(payload: RateRequest): EngineCart {
  const rate = payload.rate;
  const destination = rate?.destination;
  return {
    currency: rate?.currency ?? "USD",
    locale: rate?.locale,
    destination: {
      country: destination?.country,
      province: destination?.province,
      city: destination?.city,
      postcode: destination?.postal_code,
    },
    items: (rate?.items ?? []).map((item) => ({
      productId: item.product_id,
      variantId: item.variant_id,
      sku: item.sku,
      name: item.name,
      quantity: item.quantity ?? 0,
      grams: item.grams ?? 0,
      price: item.price ?? 0,
    })),
  };
}

/** The engine's rates → what Shopify shows at checkout, named in the buyer's language. */
export function toShippingRates(
  quoted: QuotedRate[],
  currency: string,
  locale: string | undefined,
  now: Date = new Date(),
): ShippingRate[] {
  const t = translatorFor(locale);

  return quoted.map((rate) => {
    const presetKey = rate.preset
      ? PRESET_KEYS[rate.preset as RatePreset]
      : undefined;
    const name = presetKey
      ? t(presetKey)
      : rate.name || t("rates.presetStandard");

    return {
      service_name: name,
      service_code: `sugar_ship_${rate.rateId}`,
      description: rate.description ?? "",
      total_price: String(rate.price),
      currency,
      ...(rate.minDeliveryDays != null && {
        min_delivery_date: deliveryDate(now, rate.minDeliveryDays),
      }),
      ...(rate.maxDeliveryDays != null && {
        max_delivery_date: deliveryDate(now, rate.maxDeliveryDays),
      }),
    };
  });
}

/** now + days, in the format Shopify expects: "2026-11-03 00:00:00 +0000". */
function deliveryDate(now: Date, days: number): string {
  const date = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return `${date.toISOString().slice(0, 10)} 00:00:00 +0000`;
}

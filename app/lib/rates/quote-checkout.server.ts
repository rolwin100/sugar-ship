import type { CombineStrategy } from "@prisma/client";
import { quote } from "../engine";
import { loadEngineRules } from "../rules/rule-store.server";
import type { RateRequest, ShippingRate } from "../types";
import { listZones } from "../zones/zone-store.server";
import { toEngineCart, toShippingRates } from "./checkout";

type ShopForQuote = {
  id: string;
  currency: string | null;
  settings?: { combineStrategy: CombineStrategy } | null;
};

/** Runs the shop's rules for one checkout and returns the rates to show. */
export async function quoteCheckout(
  shop: ShopForQuote,
  payload: RateRequest,
): Promise<ShippingRate[]> {
  const cart = toEngineCart(payload);

  // Prices are saved in the shop's currency and we don't convert yet,
  // so checkouts in another currency get no Sugar Ship rates.
  if (!shop.currency || shop.currency !== cart.currency) return [];

  const [zones, rules] = await Promise.all([
    listZones(shop.id),
    loadEngineRules(shop.id),
  ]);
  const result = quote(cart, rules, zones, {
    combineStrategy: shop.settings?.combineStrategy ?? "SUM",
  });
  return toShippingRates(result.rates, cart.currency, cart.locale);
}

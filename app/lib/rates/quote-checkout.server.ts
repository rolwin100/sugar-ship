import type { CombineStrategy } from "@prisma/client";
import { COMBINE_STRATEGY, CONDITION_SUBJECT, quote } from "../engine";
import { attachProductData } from "../products";
import { loadProducts } from "../products/product-store.server";
import { loadEngineRules } from "../rules/rule-store.server";
import type { RateRequest, ShippingRate } from "../types";
import { listZones } from "../zones/zone-store.server";
import { logger } from "../logger.server";
import { toEngineCart, toShippingRates } from "./checkout";

const log = logger.child({ module: "quote" });

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
  if (!shop.currency || shop.currency !== cart.currency) {
    log.info(
      { checkoutCurrency: cart.currency, shopCurrency: shop.currency },
      "quote skipped: checkout currency isn't the shop's",
    );
    return [];
  }

  const [zones, rules] = await Promise.all([
    listZones(shop.id),
    loadEngineRules(shop.id),
  ]);

  // Product conditions need tags, types and collections, which Shopify doesn't send.
  // Look them up only when some rule uses them, so other shops skip the query.
  const usesProducts = rules.some((rule) =>
    rule.conditions.some((c) => c.subject === CONDITION_SUBJECT.PRODUCT),
  );
  const items = usesProducts
    ? attachProductData(
        cart.items,
        await loadProducts(
          shop.id,
          cart.items.flatMap((item) =>
            item.productId != null ? [item.productId] : [],
          ),
        ),
      )
    : cart.items;

  const result = quote({ ...cart, items }, rules, zones, {
    combineStrategy: shop.settings?.combineStrategy ?? COMBINE_STRATEGY.SUM,
  });

  // Why each rate did or didn't show (debug level: the History page and simulator
  // show this to merchants).
  log.debug(
    {
      destination: cart.destination,
      rates: result.rates.length,
      trace: result.trace.map(({ ruleName, outcome, detail }) => ({
        ruleName,
        outcome,
        detail,
      })),
    },
    "quote",
  );

  return toShippingRates(result.rates, cart.currency, cart.locale);
}

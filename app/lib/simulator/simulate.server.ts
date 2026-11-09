import type { CombineStrategy } from "@prisma/client";
import { COMBINE_STRATEGY, matchZone, quote, type EngineCart } from "../engine";
import { attachProductData } from "../products";
import { loadProducts } from "../products/product-store.server";
import { loadEngineRules } from "../rules/rule-store.server";
import { listZones } from "../zones/zone-store.server";
import { toSimulationResult } from "./to-simulation-result";
import type { SimulationResult } from "./types";

type ShopForSimulation = {
  id: string;
  settings?: { combineStrategy: CombineStrategy } | null;
};

/**
 * Runs the shop's current rates for a made-up cart, exactly as checkout would
 * (same zones, rules, product data and engine), without Shopify or test mode.
 */
export async function simulateQuote(
  shop: ShopForSimulation,
  cart: EngineCart,
): Promise<SimulationResult> {
  const [zones, rules] = await Promise.all([
    listZones(shop.id),
    loadEngineRules(shop.id),
  ]);
  // Same product lookup as checkout: tags, type and collections from ProductSnapshot.
  const productIds = cart.items.flatMap((item) =>
    item.productId != null ? [item.productId] : [],
  );
  const snapshots = await loadProducts(shop.id, productIds);
  const items = attachProductData(cart.items, snapshots);

  const result = quote({ ...cart, items }, rules, zones, {
    combineStrategy: shop.settings?.combineStrategy ?? COMBINE_STRATEGY.SUM,
  });
  const unsynced = cart.items.flatMap((item) =>
    item.productId != null && !snapshots.has(item.productId)
      ? [item.name ?? String(item.productId)]
      : [],
  );
  return toSimulationResult(
    result,
    matchZone(cart.destination, zones),
    unsynced,
  );
}

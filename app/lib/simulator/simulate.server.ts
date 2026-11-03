import type { CombineStrategy } from "@prisma/client";
import { COMBINE_STRATEGY, matchZone, quote, type EngineCart } from "../engine";
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
 * (same zones, rules and engine), without Shopify or test mode.
 */
export async function simulateQuote(
  shop: ShopForSimulation,
  cart: EngineCart,
): Promise<SimulationResult> {
  const [zones, rules] = await Promise.all([
    listZones(shop.id),
    loadEngineRules(shop.id),
  ]);
  const result = quote(cart, rules, zones, {
    combineStrategy: shop.settings?.combineStrategy ?? COMBINE_STRATEGY.SUM,
  });
  return toSimulationResult(result, matchZone(cart.destination, zones));
}

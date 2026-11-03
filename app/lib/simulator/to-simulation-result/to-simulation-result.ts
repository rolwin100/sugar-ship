import type { EngineResult, EngineZone } from "../../engine";
import type { SimulationResult } from "../types";

/**
 * The engine's answer → what the simulator shows: the rates customers would see, and
 * every rate that gave no price with its reason. `zone` is the address's zone, if any.
 */
export function toSimulationResult(
  result: EngineResult,
  zone: EngineZone | null,
): SimulationResult {
  const names = new Map(result.trace.map((t) => [t.ruleId, t.ruleName]));

  return {
    zoneName: zone?.name ?? null,
    shown: result.rates.map((rate) => ({
      ruleId: rate.ruleId,
      ruleName: names.get(rate.ruleId) ?? "",
      zoneId: rate.zoneId,
      preset: rate.preset ?? null,
      name: rate.name ?? null,
      description: rate.description ?? null,
      minDeliveryDays: rate.minDeliveryDays ?? null,
      maxDeliveryDays: rate.maxDeliveryDays ?? null,
      price: rate.price,
    })),
    notShown: result.trace.flatMap((t) =>
      t.reason
        ? [{ ruleId: t.ruleId, ruleName: t.ruleName, reason: t.reason }]
        : [],
    ),
  };
}

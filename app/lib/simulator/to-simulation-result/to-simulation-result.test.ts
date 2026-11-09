import { describe, expect, it } from "vitest";
import type { EngineResult, EngineZone } from "../../engine";
import { toSimulationResult } from "./to-simulation-result";

const zone: EngineZone = {
  id: "dom",
  name: "Domestic",
  restOfWorld: false,
  regions: [{ country: "IN", provinces: null }],
};

const result: EngineResult = {
  rates: [
    {
      rateId: "rate1",
      ruleId: "express",
      zoneId: "dom",
      preset: "express",
      minDeliveryDays: 1,
      maxDeliveryDays: 2,
      price: 19000,
    },
  ],
  trace: [
    { ruleId: "express", ruleName: "Express", outcome: "matched" },
    {
      ruleId: "promo",
      ruleName: "Weekend promo",
      outcome: "skipped_inactive",
      reason: { kind: "inactive" },
    },
  ],
};

describe("toSimulationResult", () => {
  it("splits rates into shown and not shown, with names and reasons", () => {
    expect(toSimulationResult(result, zone)).toEqual({
      zoneName: "Domestic",
      unsyncedProducts: [],
      shown: [
        {
          ruleId: "express",
          ruleName: "Express",
          zoneId: "dom",
          preset: "express",
          name: null,
          description: null,
          minDeliveryDays: 1,
          maxDeliveryDays: 2,
          price: 19000,
        },
      ],
      notShown: [
        {
          ruleId: "promo",
          ruleName: "Weekend promo",
          reason: { kind: "inactive" },
        },
      ],
    });
  });

  it("has no zone name when the address is in no zone", () => {
    expect(toSimulationResult({ rates: [], trace: [] }, null)).toEqual({
      zoneName: null,
      unsyncedProducts: [],
      shown: [],
      notShown: [],
    });
  });

  it("passes on the products Sugar Ship hasn't synced", () => {
    expect(
      toSimulationResult({ rates: [], trace: [] }, null, ["Lunch Bag"])
        .unsyncedProducts,
    ).toEqual(["Lunch Bag"]);
  });
});

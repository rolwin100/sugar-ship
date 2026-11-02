import { describe, expect, it } from "vitest";
import { emptyZonePricingDraft } from "../draft/pricing-draft";
import type { ZonePricingDraft } from "../types";
import { RATE_BASIS, RATE_MODE } from "../../engine";
import {
  replaceZoneBasis,
  replaceZoneField,
  replaceZoneMode,
  replaceZoneOffered,
} from "./edit-pricing";

const priced = (overrides: Partial<ZonePricingDraft> = {}) => ({
  ...emptyZonePricingDraft(),
  offered: true,
  ...overrides,
});

describe("replaceZoneOffered", () => {
  it("starts a missing zone from the empty draft", () => {
    expect(replaceZoneOffered({}, "dom", true).dom).toEqual(priced());
  });

  it("keeps what was typed when switched off", () => {
    const prices = { dom: priced({ price: "80" }) };
    expect(replaceZoneOffered(prices, "dom", false).dom).toEqual({
      ...prices.dom,
      offered: false,
    });
  });
});

describe("replaceZoneMode", () => {
  it("keeps each mode's typed fields", () => {
    const prices = { dom: priced({ price: "80", percent: "2.5" }) };
    const next = replaceZoneMode(prices, "dom", RATE_MODE.PERCENT);
    expect(next.dom).toMatchObject({
      mode: RATE_MODE.PERCENT,
      price: "80",
      percent: "2.5",
    });
  });
});

describe("replaceZoneBasis", () => {
  it("clears band limits and step size, keeps prices", () => {
    const prices = {
      dom: priced({
        basis: RATE_BASIS.WEIGHT,
        bands: [
          { from: "0", to: "2", price: "50" },
          { from: "2", to: "", price: "90" },
        ],
        stepSize: "0.5",
        stepPrice: "20",
      }),
    };
    expect(
      replaceZoneBasis(prices, "dom", RATE_BASIS.QUANTITY).dom,
    ).toMatchObject({
      basis: RATE_BASIS.QUANTITY,
      bands: [
        { from: "0", to: "", price: "50" },
        { from: "", to: "", price: "90" },
      ],
      stepSize: "",
      stepPrice: "20",
    });
  });

  it("does nothing when the basis is the same", () => {
    const prices = { dom: priced({ stepSize: "0.5" }) };
    expect(replaceZoneBasis(prices, "dom", RATE_BASIS.WEIGHT).dom).toBe(
      prices.dom,
    );
  });
});

describe("replaceZoneField", () => {
  it("types into one field and keeps other zones", () => {
    const prices = { intl: priced({ price: "1500" }) };
    const next = replaceZoneField(prices, "dom", "stepPrice", "20");
    expect(next.dom.stepPrice).toBe("20");
    expect(next.intl).toBe(prices.intl);
    expect(prices).not.toHaveProperty("dom");
  });
});

import { describe, expect, it } from "vitest";
import { emptyZonePricingDraft } from "../draft/pricing-draft";
import { replaceZoneFlatPrice } from "./edit-pricing";

describe("replaceZoneFlatPrice", () => {
  it("switches a zone on as flat when a price is typed, and off when cleared", () => {
    const on = replaceZoneFlatPrice({}, "dom", "80");
    expect(on.dom).toMatchObject({ offered: true, mode: "FLAT", price: "80" });

    const off = replaceZoneFlatPrice(on, "dom", " ");
    expect(off.dom).toMatchObject({ offered: false, price: " " });
  });

  it("keeps other zones and doesn't change the original", () => {
    const prices = {
      intl: { ...emptyZonePricingDraft(), offered: true, price: "1500" },
    };
    const next = replaceZoneFlatPrice(prices, "dom", "80");
    expect(next.intl).toBe(prices.intl);
    expect(prices).not.toHaveProperty("dom");
  });
});

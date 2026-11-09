import { describe, expect, it } from "vitest";
import { readSimulatorDraft } from "./read-draft";

describe("readSimulatorDraft", () => {
  it("reads every field as text, defaulting to empty", () => {
    const form = new FormData();
    form.set("country", "IN");
    form.set("subtotal", "1000");
    expect(readSimulatorDraft(form)).toEqual({
      country: "IN",
      province: "",
      postcode: "",
      subtotal: "1000",
      weight: "",
      quantity: "",
      lines: [],
    });
  });

  it("reads the posted lines and drops malformed ones", () => {
    const line = {
      productId: 1,
      variantId: 11,
      title: "Lunch Bag",
      sku: null,
      vendor: "Acme",
      price: 31000,
      grams: 500,
      quantity: "2",
    };
    const form = new FormData();
    form.set(
      "lines",
      JSON.stringify([line, { ...line, variantId: "x" }, null, "junk"]),
    );
    expect(readSimulatorDraft(form).lines).toEqual([line]);
  });

  it("treats lines that aren't valid JSON as none", () => {
    const form = new FormData();
    form.set("lines", "{not json");
    expect(readSimulatorDraft(form).lines).toEqual([]);
  });
});

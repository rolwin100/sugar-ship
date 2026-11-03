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
    });
  });
});

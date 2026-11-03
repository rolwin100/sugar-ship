import { describe, expect, it } from "vitest";
import { createI18n } from "../../../lib/i18n";
import { simulatorErrorMessage } from "./simulatorErrorMessage";

describe("simulatorErrorMessage", () => {
  it("has a message for every error in every language", () => {
    const keys = [
      "countryRequired",
      "subtotalInvalid",
      "weightInvalid",
      "quantityInvalid",
    ] as const;
    for (const locale of ["en", "fr", "de"] as const) {
      const t = createI18n(locale).t;
      for (const key of keys) {
        const message = simulatorErrorMessage({ field: "country", key }, t);
        expect(message).not.toMatch(/^simulator\./);
      }
    }
  });
});

import { describe, expect, it } from "vitest";
import {
  currencyDecimals,
  currencySymbol,
  formatMoney,
  fromSubunits,
  toSubunits,
} from "./money";

describe("money", () => {
  it("knows each currency's decimals", () => {
    expect(currencyDecimals("INR")).toBe(2);
    expect(currencyDecimals("JPY")).toBe(0);
    expect(currencyDecimals("KWD")).toBe(3);
    expect(currencyDecimals("NOT-A-CODE")).toBe(2);
  });

  it("turns typed amounts into subunits", () => {
    expect(toSubunits("80", "INR")).toBe(8000);
    expect(toSubunits("80.5", "INR")).toBe(8050);
    expect(toSubunits(" 1,500.00 ", "INR")).toBe(150000);
    expect(toSubunits("0", "INR")).toBe(0);
    expect(toSubunits("500", "JPY")).toBe(500);
    expect(toSubunits("", "INR")).toBeNull();
  });

  it("rejects amounts that aren't valid", () => {
    expect(toSubunits("abc", "INR")).toBeNaN();
    expect(toSubunits("-5", "INR")).toBeNaN();
    expect(toSubunits("1.234", "INR")).toBeNaN();
    expect(toSubunits("5.5", "JPY")).toBeNaN();
  });

  it("turns subunits back into text", () => {
    expect(fromSubunits(8000, "INR")).toBe("80.00");
    expect(fromSubunits(8050, "INR")).toBe("80.50");
    expect(fromSubunits(500, "JPY")).toBe("500");
  });

  it("formats prices for display", () => {
    expect(formatMoney(150000, "INR", "en")).toBe("₹1,500.00");
    // German puts a non-breaking space before the symbol.
    expect(formatMoney(8000, "EUR", "de").replace(/\s/g, " ")).toBe("80,00 €");
  });
});

describe("currencySymbol", () => {
  it("gives the symbol, or the code when there isn't one", () => {
    expect(currencySymbol("INR")).toBe("₹");
    expect(currencySymbol("EUR", "de")).toBe("€");
    expect(currencySymbol("XYZ")).toBe("XYZ");
  });
});

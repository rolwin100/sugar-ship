import { describe, expect, it } from "vitest";
import { gramsToKg, kgToGrams } from "./weight";

describe("weight", () => {
  it("turns typed kilograms into grams", () => {
    expect(kgToGrams("5")).toBe(5000);
    expect(kgToGrams("1.5")).toBe(1500);
    expect(kgToGrams(" 0.25 ")).toBe(250);
    expect(kgToGrams("0.001")).toBe(1);
    expect(kgToGrams("1,000")).toBe(1_000_000);
    expect(kgToGrams("")).toBeNull();
  });

  it("rejects amounts that aren't valid", () => {
    expect(kgToGrams("abc")).toBeNaN();
    expect(kgToGrams("-1")).toBeNaN();
    expect(kgToGrams("0.0005")).toBeNaN();
  });

  it("turns grams back into kilograms", () => {
    expect(gramsToKg(5000)).toBe("5");
    expect(gramsToKg(1500)).toBe("1.5");
    expect(gramsToKg(1)).toBe("0.001");
  });
});

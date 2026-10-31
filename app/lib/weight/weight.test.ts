import { describe, expect, it } from "vitest";
import { gramsToKg, kgToGrams } from "./weight";

describe("weight", () => {
  it("turns typed kilograms into grams", () => {
    expect(kgToGrams("1.5")).toBe(1500);
    expect(kgToGrams("2")).toBe(2000);
    expect(kgToGrams("0.25")).toBe(250);
    expect(kgToGrams(" 0.001 ")).toBe(1);
    expect(kgToGrams("0")).toBe(0);
    expect(kgToGrams("")).toBeNull();
  });

  it("rejects text that isn't a valid weight", () => {
    expect(kgToGrams("abc")).toBeNaN();
    expect(kgToGrams("-1")).toBeNaN();
    expect(kgToGrams("1.2345")).toBeNaN();
    expect(kgToGrams("1,5")).toBeNaN();
  });

  it("turns grams back into kilograms", () => {
    expect(gramsToKg(1500)).toBe("1.5");
    expect(gramsToKg(2000)).toBe("2");
    expect(gramsToKg(1)).toBe("0.001");
    expect(gramsToKg(0)).toBe("0");
  });
});

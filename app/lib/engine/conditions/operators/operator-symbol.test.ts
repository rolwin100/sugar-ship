import { describe, expect, it } from "vitest";
import { operatorSymbol } from "./operator-symbol";

describe("operatorSymbol", () => {
  it("has a symbol for each number operator", () => {
    expect(operatorSymbol("GREATER_OR_EQUAL")).toBe("≥");
    expect(operatorSymbol("NOT_EQUALS")).toBe("≠");
    expect(operatorSymbol("IN")).toBe("IN");
  });
});

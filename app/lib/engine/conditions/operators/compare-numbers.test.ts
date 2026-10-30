import { describe, expect, it } from "vitest";
import { compareNumbers, isNumberOperator } from "./compare-numbers";

describe("number operators", () => {
  it("compares each operator, including the edges", () => {
    expect(compareNumbers("EQUALS", 100, 100)).toBe(true);
    expect(compareNumbers("EQUALS", 100, 99)).toBe(false);
    expect(compareNumbers("NOT_EQUALS", 100, 99)).toBe(true);
    expect(compareNumbers("GREATER_THAN", 100, 100)).toBe(false);
    expect(compareNumbers("GREATER_THAN", 100, 99)).toBe(true);
    expect(compareNumbers("GREATER_OR_EQUAL", 100, 100)).toBe(true);
    expect(compareNumbers("LESS_THAN", 100, 100)).toBe(false);
    expect(compareNumbers("LESS_OR_EQUAL", 100, 100)).toBe(true);
  });

  it("returns null for operators that don't compare numbers", () => {
    expect(compareNumbers("IN", 1, 1)).toBeNull();
    expect(compareNumbers("CONTAINS", 1, 1)).toBeNull();
    expect(isNumberOperator("IN")).toBe(false);
    expect(isNumberOperator("LESS_THAN")).toBe(true);
  });
});

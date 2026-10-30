import { describe, expect, it } from "vitest";
import type {
  CartTotals,
  ConditionOperator,
  EngineCondition,
} from "../../types";
import { checkCartCondition } from "./cart-condition";

const totals: CartTotals = { subtotal: 100000, weight: 2000, quantity: 3 };

const condition = (
  field: string,
  operator: ConditionOperator,
  value: unknown,
): EngineCondition => ({ id: "c1", subject: "CART", field, operator, value });

describe("checkCartCondition", () => {
  it("checks subtotal, weight and quantity", () => {
    expect(
      checkCartCondition(
        condition("subtotal", "GREATER_OR_EQUAL", 100000),
        totals,
      ),
    ).toEqual({ result: true, text: "subtotal 100000 ≥ 100000" });
    expect(
      checkCartCondition(condition("weight", "GREATER_THAN", 1500), totals),
    ).toEqual({ result: true, text: "weight 2000 > 1500" });
    expect(
      checkCartCondition(condition("quantity", "GREATER_OR_EQUAL", 10), totals),
    ).toEqual({ result: false, text: "quantity 3 ≥ 10" });
  });

  it("can't check unknown fields, non-number operators or bad values", () => {
    const unsupported = (c: EngineCondition) =>
      "unsupported" in checkCartCondition(c, totals);

    expect(unsupported(condition("colour", "EQUALS", 1))).toBe(true);
    expect(unsupported(condition("subtotal", "IN", 1))).toBe(true);
    expect(unsupported(condition("subtotal", "GREATER_THAN", "1000"))).toBe(
      true,
    );
    expect(unsupported(condition("subtotal", "GREATER_THAN", Number.NaN))).toBe(
      true,
    );
  });
});

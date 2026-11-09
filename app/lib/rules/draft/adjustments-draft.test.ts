import { describe, expect, it } from "vitest";
import {
  adjustmentsToDraft,
  draftToAdjustments,
  emptyAdjustmentsDraft,
  isAdjustmentsDraft,
} from "./adjustments-draft";

const draft = (fields: Partial<ReturnType<typeof emptyAdjustmentsDraft>>) => ({
  ...emptyAdjustmentsDraft(),
  ...fields,
});

describe("draftToAdjustments", () => {
  it("is empty when nothing is filled", () => {
    expect(draftToAdjustments(draft({ roundTo: " " }), "INR")).toEqual([]);
  });

  it("turns filled fields into adjustments, in the order they apply", () => {
    expect(
      draftToAdjustments(
        draft({ maxPrice: "300", freeOver: "1000", handlingFee: "15" }),
        "INR",
      ),
    ).toEqual([
      { kind: "FREE_OVER", type: "FIXED", value: 100000 },
      { kind: "HANDLING_FEE", type: "FIXED", value: 1500 },
      { kind: "MAX_PRICE", type: "FIXED", value: 30000 },
    ]);
  });

  it("stores a percent handling fee in basis points", () => {
    expect(
      draftToAdjustments(
        draft({ handlingFee: "2.5", handlingType: "PERCENT" }),
        "INR",
      ),
    ).toEqual([{ kind: "HANDLING_FEE", type: "PERCENT", value: 250 }]);
  });

  it("marks text it can't read as NaN", () => {
    const [adjustment] = draftToAdjustments(draft({ minPrice: "abc" }), "INR");
    expect(adjustment.value).toBeNaN();
  });
});

describe("adjustmentsToDraft", () => {
  it("fills the form's fields and the handling fee's type", () => {
    expect(
      adjustmentsToDraft(
        [
          { kind: "ROUND_TO", type: "FIXED", value: 1000 },
          { kind: "HANDLING_FEE", type: "PERCENT", value: 500 },
        ],
        "INR",
      ),
    ).toEqual(
      draft({ roundTo: "10.00", handlingFee: "5", handlingType: "PERCENT" }),
    );
  });

  it("round-trips through draftToAdjustments", () => {
    const filled = draft({
      freeOver: "1000.00",
      handlingFee: "15.00",
      roundTo: "10.00",
      minPrice: "50.00",
      maxPrice: "300.00",
    });
    expect(
      adjustmentsToDraft(draftToAdjustments(filled, "INR"), "INR"),
    ).toEqual(filled);
  });
});

describe("isAdjustmentsDraft", () => {
  it("checks the shape of posted adjustments", () => {
    expect(isAdjustmentsDraft(emptyAdjustmentsDraft())).toBe(true);
    expect(isAdjustmentsDraft(draft({ freeOver: 10 as never }))).toBe(false);
    expect(isAdjustmentsDraft(draft({ handlingType: "HALF" as never }))).toBe(
      false,
    );
    expect(isAdjustmentsDraft(null)).toBe(false);
  });
});

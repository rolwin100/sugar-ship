import { describe, expect, it } from "vitest";
import { NO_ADJUSTMENTS } from "../../engine";
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
  it("is all null when nothing is filled", () => {
    expect(draftToAdjustments(draft({ roundTo: " " }), "INR")).toEqual(
      NO_ADJUSTMENTS,
    );
  });

  it("turns filled fields into amounts in subunits", () => {
    expect(
      draftToAdjustments(
        draft({ maxPrice: "300", freeOver: "1000", handlingFee: "15" }),
        "INR",
      ),
    ).toEqual({
      ...NO_ADJUSTMENTS,
      freeOver: 100000,
      handlingFee: { type: "FIXED", value: 1500 },
      maxPrice: 30000,
    });
  });

  it("stores a percent handling fee in basis points", () => {
    expect(
      draftToAdjustments(
        draft({ handlingFee: "2.5", handlingType: "PERCENT" }),
        "INR",
      ).handlingFee,
    ).toEqual({ type: "PERCENT", value: 250 });
  });

  it("marks text it can't read as NaN", () => {
    const adjustments = draftToAdjustments(
      draft({ minPrice: "abc", handlingFee: "x", handlingType: "PERCENT" }),
      "INR",
    );
    expect(adjustments.minPrice).toBeNaN();
    expect(adjustments.handlingFee?.value).toBeNaN();
  });
});

describe("adjustmentsToDraft", () => {
  it("fills the form's fields and the handling fee's type", () => {
    expect(
      adjustmentsToDraft(
        {
          ...NO_ADJUSTMENTS,
          roundTo: 1000,
          handlingFee: { type: "PERCENT", value: 500 },
        },
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

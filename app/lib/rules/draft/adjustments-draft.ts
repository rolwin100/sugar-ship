import { ADJUSTMENT_KIND, ADJUSTMENT_TYPE } from "../../engine";
import { fromSubunits, toSubunits } from "../../money";
import type {
  AdjustmentsDraft,
  AdjustmentTextField,
  PriceAdjustment,
} from "../types";
import { bpsToPercent, percentToBps } from "./percent";

// Converts a zone's price adjustments between the form (typed text) and stored values
// (subunits; a percent handling fee in basis points). Each filled field is one
// adjustment; text that can't be read becomes NaN, so validation can point at it.

/** Which form field each adjustment kind is typed in. */
export const ADJUSTMENT_FIELD = {
  FREE_OVER: "freeOver",
  HANDLING_FEE: "handlingFee",
  ROUND_TO: "roundTo",
  MIN_PRICE: "minPrice",
  MAX_PRICE: "maxPrice",
} as const satisfies Record<PriceAdjustment["kind"], AdjustmentTextField>;

/** Kinds in the order they're applied (and listed). */
const KINDS_IN_ORDER = [
  ADJUSTMENT_KIND.FREE_OVER,
  ADJUSTMENT_KIND.HANDLING_FEE,
  ADJUSTMENT_KIND.ROUND_TO,
  ADJUSTMENT_KIND.MIN_PRICE,
  ADJUSTMENT_KIND.MAX_PRICE,
] as const;

/** No adjustments: every field empty, handling fee as a fixed amount. */
export const emptyAdjustmentsDraft = (): AdjustmentsDraft => ({
  freeOver: "",
  handlingFee: "",
  handlingType: ADJUSTMENT_TYPE.FIXED,
  roundTo: "",
  minPrice: "",
  maxPrice: "",
});

/** The form's text → the adjustments to validate and save; empty fields are left out. */
export function draftToAdjustments(
  draft: AdjustmentsDraft,
  currency: string,
): PriceAdjustment[] {
  return KINDS_IN_ORDER.flatMap((kind) => {
    const text = draft[ADJUSTMENT_FIELD[kind]];
    if (text.trim() === "") return [];
    const percent =
      kind === ADJUSTMENT_KIND.HANDLING_FEE &&
      draft.handlingType === ADJUSTMENT_TYPE.PERCENT;
    const value = percent ? percentToBps(text) : toSubunits(text, currency);
    return [
      {
        kind,
        type: percent ? ADJUSTMENT_TYPE.PERCENT : ADJUSTMENT_TYPE.FIXED,
        value: value ?? Number.NaN,
      },
    ];
  });
}

/** Saved adjustments → the form's text. */
export function adjustmentsToDraft(
  adjustments: PriceAdjustment[],
  currency: string,
): AdjustmentsDraft {
  return adjustments.reduce((draft, { kind, type, value }) => {
    const percent =
      kind === ADJUSTMENT_KIND.HANDLING_FEE && type === ADJUSTMENT_TYPE.PERCENT;
    return {
      ...draft,
      [ADJUSTMENT_FIELD[kind]]: percent
        ? bpsToPercent(value)
        : fromSubunits(value, currency),
      ...(kind === ADJUSTMENT_KIND.HANDLING_FEE ? { handlingType: type } : {}),
    };
  }, emptyAdjustmentsDraft());
}

/** Does a posted value look like an AdjustmentsDraft? (Shape only.) */
export function isAdjustmentsDraft(value: unknown): value is AdjustmentsDraft {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const d = value as Record<string, unknown>;
  return (
    Object.values(ADJUSTMENT_FIELD).every(
      (key) => typeof d[key] === "string",
    ) &&
    (d.handlingType === ADJUSTMENT_TYPE.FIXED ||
      d.handlingType === ADJUSTMENT_TYPE.PERCENT)
  );
}

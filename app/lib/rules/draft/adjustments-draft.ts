import { ADJUSTMENT_TYPE } from "../../engine";
import { fromSubunits, toSubunits } from "../../money";
import type {
  AdjustmentsDraft,
  AdjustmentTextField,
  PriceAdjustments,
} from "../types";
import { bpsToPercent, percentToBps } from "./percent";

// Converts a zone's price adjustments between the form (typed text) and stored values
// (subunits; a percent handling fee in basis points). An empty field is null (not
// used); text that can't be read becomes NaN, so validation can point at it.

/** The adjustments typed as text, in the order they apply. */
const TEXT_FIELDS = [
  "freeOver",
  "handlingFee",
  "roundTo",
  "minPrice",
  "maxPrice",
] as const satisfies readonly AdjustmentTextField[];

/** No adjustments: every field empty, handling fee as a fixed amount. */
export const emptyAdjustmentsDraft = (): AdjustmentsDraft => ({
  freeOver: "",
  handlingFee: "",
  handlingType: ADJUSTMENT_TYPE.FIXED,
  roundTo: "",
  minPrice: "",
  maxPrice: "",
});

/** The form's text → the adjustments to validate and save. */
export function draftToAdjustments(
  draft: AdjustmentsDraft,
  currency: string,
): PriceAdjustments {
  const amount = (text: string) =>
    text.trim() === "" ? null : (toSubunits(text, currency) ?? Number.NaN);
  const fee = draft.handlingFee;
  const percent = draft.handlingType === ADJUSTMENT_TYPE.PERCENT;

  return {
    freeOver: amount(draft.freeOver),
    handlingFee:
      fee.trim() === ""
        ? null
        : {
            type: draft.handlingType,
            value: (percent ? percentToBps(fee) : amount(fee)) ?? Number.NaN,
          },
    roundTo: amount(draft.roundTo),
    minPrice: amount(draft.minPrice),
    maxPrice: amount(draft.maxPrice),
  };
}

/** Saved adjustments → the form's text. */
export function adjustmentsToDraft(
  adjustments: PriceAdjustments,
  currency: string,
): AdjustmentsDraft {
  const text = (value: number | null) =>
    value === null ? "" : fromSubunits(value, currency);
  const { handlingFee } = adjustments;

  return {
    freeOver: text(adjustments.freeOver),
    handlingFee: !handlingFee
      ? ""
      : handlingFee.type === ADJUSTMENT_TYPE.PERCENT
        ? bpsToPercent(handlingFee.value)
        : text(handlingFee.value),
    handlingType: handlingFee?.type ?? ADJUSTMENT_TYPE.FIXED,
    roundTo: text(adjustments.roundTo),
    minPrice: text(adjustments.minPrice),
    maxPrice: text(adjustments.maxPrice),
  };
}

/** Does a posted value look like an AdjustmentsDraft? (Shape only.) */
export function isAdjustmentsDraft(value: unknown): value is AdjustmentsDraft {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const d = value as Record<string, unknown>;
  return (
    TEXT_FIELDS.every((key) => typeof d[key] === "string") &&
    (d.handlingType === ADJUSTMENT_TYPE.FIXED ||
      d.handlingType === ADJUSTMENT_TYPE.PERCENT)
  );
}

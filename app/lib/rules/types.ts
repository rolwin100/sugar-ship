import { RATE_BASIS, RATE_MODE, RULE_MATCH } from "../engine";
import type {
  AdjustmentType,
  CartConditionField,
  CONDITION_SUBJECT,
  EngineAdjustments,
  NumberOperator,
  ProductConditionField,
  Quantifier,
  RateBasis,
  RateMode,
  RuleMatch,
  RuleStatus,
  TextOperator,
} from "../engine";
import { RATE_PRESET } from "./constants";
import type { RuleError } from "./validate-rule";

export type RatePreset = (typeof RATE_PRESET)[keyof typeof RATE_PRESET];

/** Built-in presets in display order. */
export const RATE_PRESETS = [
  RATE_PRESET.STANDARD,
  RATE_PRESET.EXPRESS,
  RATE_PRESET.ECONOMY,
  RATE_PRESET.FREE,
  RATE_PRESET.NEXT_DAY,
] as const satisfies readonly RatePreset[];

/** How a rate's conditions combine: all, any, or none of them true. */
export const RULE_MATCHES = [
  RULE_MATCH.ALL,
  RULE_MATCH.ANY,
  RULE_MATCH.NONE,
] as const satisfies readonly RuleMatch[];

/** The ways a zone can be priced (engine/pricing does the maths). */
export const PRICING_MODES = [
  RATE_MODE.FLAT,
  RATE_MODE.BANDS,
  RATE_MODE.INCREMENTAL,
  RATE_MODE.PERCENT,
] as const satisfies readonly RateMode[];

/** What BANDS and INCREMENTAL pricing are based on. */
export const PRICING_BASES = [
  RATE_BASIS.WEIGHT,
  RATE_BASIS.SUBTOTAL,
  RATE_BASIS.QUANTITY,
] as const satisfies readonly RateBasis[];

/**
 * One row of a price table, in stored units: `from`/`to` in grams, subunits or items
 * (by the zone's basis), `price` in subunits. Covers from ≤ value < to; to null = and above.
 */
export type PriceBand = { from: number; to: number | null; price: number };

/**
 * How one zone is priced, in stored units (money in subunits, weight in grams,
 * percentages in basis points). Zones without a pricing don't get this rate.
 */
/**
 * A zone's price adjustments in stored units (subunits; a percent handling fee in
 * basis points), one property per kind, null when not used. The shape the engine applies.
 */
export type PriceAdjustments = EngineAdjustments;

/** A RateAdjustment row's columns: a rate's adjustments as stored (null = not used). */
export type AdjustmentColumns = {
  freeOver: number | null;
  handlingFee: number | null;
  handlingFeeType: AdjustmentType | null;
  roundTo: number | null;
  minPrice: number | null;
  maxPrice: number | null;
};

/** One zone's pricing: how the base price is worked out, then its adjustments. */
export type ZonePricing = BasePricing & { adjustments: PriceAdjustments };

/** How one zone's base price is worked out, by mode. */
export type BasePricing =
  | { zoneId: string; mode: typeof RATE_MODE.FLAT; price: number }
  | {
      zoneId: string;
      mode: typeof RATE_MODE.BANDS;
      basis: RateBasis;
      bands: PriceBand[];
    }
  | {
      zoneId: string;
      mode: typeof RATE_MODE.INCREMENTAL;
      basis: RateBasis;
      basePrice: number; // covers the first step
      stepSize: number; // grams, subunits or items
      stepPrice: number; // per further step
    }
  | { zoneId: string; mode: typeof RATE_MODE.PERCENT; percentBps: number };

/**
 * A zone's optional adjustments as typed, applied after the base price: free over a cart
 * subtotal, a handling fee (fixed amount or % of shipping), rounding up, and a
 * minimum and maximum price. Amounts in the shop's currency; "" means not used.
 */
export type AdjustmentsDraft = {
  freeOver: string;
  handlingFee: string;
  handlingType: AdjustmentType; // FIXED = amount, PERCENT = % of shipping
  roundTo: string;
  minPrice: string;
  maxPrice: string;
};

/** The adjustments typed as text (all but the handling fee's type). */
export type AdjustmentTextField = Exclude<
  keyof AdjustmentsDraft,
  "handlingType"
>;

/** A price-table row as typed in the form. */
export type PriceBandDraft = { from: string; to: string; price: string };

/**
 * One zone's pricing as the form holds it: every mode's fields as typed text, so
 * switching modes keeps what the merchant typed. Units follow the basis: weight in
 * kg, subtotal in the shop's currency, quantity in items; percent as "5" or "2.5".
 */
export type ZonePricingDraft = {
  offered: boolean; // false = this zone doesn't get the rate
  adjustments: AdjustmentsDraft;
  mode: RateMode;
  basis: RateBasis; // BANDS and INCREMENTAL
  price: string; // FLAT
  bands: PriceBandDraft[];
  basePrice: string;
  stepSize: string;
  stepPrice: string;
  percent: string;
};

/**
 * One cart condition on a rate, in stored units:
 * subtotal in subunits, weight in grams, quantity in items.
 * Saved as a Condition row with subject CART.
 */
export type CartRuleCondition = {
  subject: typeof CONDITION_SUBJECT.CART;
  field: CartConditionField;
  operator: NumberOperator;
  value: number;
};

/**
 * One product condition, checked on each item and combined with the quantifier
 * (any / all / no item). Text values are kept as typed (matching ignores case); a list
 * for is one of / is none of. Collections are always a list of collection ids.
 * Saved as a Condition row with subject PRODUCT.
 */
export type ProductRuleCondition = {
  subject: typeof CONDITION_SUBJECT.PRODUCT;
  field: ProductConditionField;
  operator: TextOperator;
  quantifier: Quantifier;
  value: string | string[] | number[];
};

export type RuleCondition = CartRuleCondition | ProductRuleCondition;

/** The single-value text fields of a zone pricing draft (bands are edited as rows). */
export type ZonePricingTextField = keyof Pick<
  ZonePricingDraft,
  "price" | "basePrice" | "stepSize" | "stepPrice" | "percent"
>;

/** A Rate row's pricing columns as read from the database, before they're checked (see toZonePricing). */
export type StoredPricing = {
  zoneId: string;
  mode: RateMode;
  basis: RateBasis | null;
  price: number | null; // FLAT price, or INCREMENTAL base price
  stepSize: number | null;
  stepPrice: number | null;
  percentBps: number | null;
  bands: PriceBand[];
  adjustments: AdjustmentColumns | null; // null when the rate has no RateAdjustment row
};

/** A zone pricing as Rate columns plus its RateBand rows and RateAdjustment row, ready to save (see toPricingColumns). */
export type PricingColumns = Omit<
  StoredPricing,
  "zoneId" | "bands" | "adjustments"
> & {
  bands: (PriceBand & { sortOrder: number })[];
  adjustments: AdjustmentColumns | null; // null when none are used (no row is saved)
};

/** A Condition row as read from the database, before it's checked (see toRuleCondition). */
export type StoredCondition = {
  subject: string;
  field: string;
  operator: string;
  value: unknown; // JSON column
  quantifier: string | null; // product conditions only
};

/**
 * A condition as the edit form holds it. `value` is the typed text, in the units the
 * merchant sees: subtotal in the shop's currency ("1000"), weight in kg ("1.5"),
 * quantity in items ("10").
 */
export type CartConditionDraft = {
  subject: typeof CONDITION_SUBJECT.CART;
  field: CartConditionField;
  operator: NumberOperator;
  value: string;
};

/** A collection chosen in the form: its id, and its title to show (may be "" until loaded). */
export type CollectionChoice = { id: number; title: string };

/**
 * A product condition as the form holds it: text values as typed (comma-separated
 * for is one of / is none of), collections as chosen in Shopify's picker.
 */
export type ProductConditionDraft = {
  subject: typeof CONDITION_SUBJECT.PRODUCT;
  field: ProductConditionField;
  operator: TextOperator;
  quantifier: Quantifier;
  value: string; // text fields
  collections: CollectionChoice[]; // collection field
};

export type RuleConditionDraft = CartConditionDraft | ProductConditionDraft;

/**
 * A shipping rate as the merchant sees it ("Rates" in the admin; a Rule in the database).
 * For now one checkout name and delivery estimate apply to every zone; each priced zone
 * is one Rate row.
 */
export type RuleInput = {
  name: string; // admin only
  status: RuleStatus;
  preset: RatePreset | null; // null = use customName
  customName: string;
  description: string; // shown under the name at checkout; "" = none
  minDeliveryDays: number | null;
  maxDeliveryDays: number | null;
  prices: ZonePricing[]; // zones without a pricing don't get this rate
  match: RuleMatch;
  conditions: RuleCondition[]; // none = the rate always applies
};

export type Rule = RuleInput & { id: string };

export type SaveRuleResult =
  | { ok: true; rule: Rule }
  | { ok: false; errors: RuleError[] }
  | { ok: false; notFound: true };

/** The rule as the edit page holds it: everything as typed text. */
export type RuleDraft = {
  name: string;
  status: RuleStatus;
  preset: RatePreset | "custom";
  customName: string;
  description: string;
  minDeliveryDays: string;
  maxDeliveryDays: string;
  prices: Record<string, ZonePricingDraft>; // zoneId → that zone's pricing
  match: RuleMatch;
  conditions: RuleConditionDraft[];
};

/** What the rule edit action returns to the page. */
export type RuleActionResult =
  | { ok: true; intent: "save" | "delete" }
  | { ok: false; errors: RuleError[] }
  | { ok: false; invalid: true };

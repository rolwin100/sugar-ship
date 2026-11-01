import type {
  CartConditionField,
  NumberOperator,
  RateBasis,
  RateMode,
  RuleMatch,
} from "../engine";
import type { RuleError } from "./validate-rule";

/** Built-in checkout names; translated into the checkout's language (keys rates.preset*). */
export const RATE_PRESETS = [
  "standard",
  "express",
  "economy",
  "free",
  "next_day",
] as const;
export type RatePreset = (typeof RATE_PRESETS)[number];

export type RuleStatus = "ACTIVE" | "INACTIVE";

/** How a rate's conditions combine: all, any, or none of them true. */
export const RULE_MATCHES = [
  "ALL",
  "ANY",
  "NONE",
] as const satisfies readonly RuleMatch[];

/** The ways a zone can be priced (engine/pricing does the maths). */
export const PRICING_MODES = [
  "FLAT",
  "BANDS",
  "INCREMENTAL",
  "PERCENT",
] as const satisfies readonly RateMode[];

/** What BANDS and INCREMENTAL pricing are based on. */
export const PRICING_BASES = [
  "WEIGHT",
  "SUBTOTAL",
  "QUANTITY",
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
export type ZonePricing =
  | { zoneId: string; mode: "FLAT"; price: number }
  | { zoneId: string; mode: "BANDS"; basis: RateBasis; bands: PriceBand[] }
  | {
      zoneId: string;
      mode: "INCREMENTAL";
      basis: RateBasis;
      basePrice: number; // covers the first step
      stepSize: number; // grams, subunits or items
      stepPrice: number; // per further step
    }
  | { zoneId: string; mode: "PERCENT"; percentBps: number };

/** A price-table row as typed in the form. */
export type PriceBandDraft = { from: string; to: string; price: string };

/**
 * One zone's pricing as the form holds it: every mode's fields as typed text, so
 * switching modes keeps what the merchant typed. Units follow the basis: weight in
 * kg, subtotal in the shop's currency, quantity in items; percent as "5" or "2.5".
 */
export type ZonePricingDraft = {
  offered: boolean; // false = this zone doesn't get the rate
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
export type RuleCondition = {
  field: CartConditionField;
  operator: NumberOperator;
  value: number;
};

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
};

/** A zone pricing as Rate columns plus RateBand rows, ready to save (see toPricingColumns). */
export type PricingColumns = Omit<StoredPricing, "zoneId" | "bands"> & {
  bands: (PriceBand & { sortOrder: number })[];
};

/** A Condition row as read from the database, before it's checked (see toRuleCondition). */
export type StoredCondition = {
  subject: string;
  field: string;
  operator: string;
  value: unknown; // JSON column
};

/**
 * A condition as the edit form holds it. `value` is the typed text, in the units the
 * merchant sees: subtotal in the shop's currency ("1000"), weight in kg ("1.5"),
 * quantity in items ("10").
 */
export type RuleConditionDraft = {
  field: CartConditionField;
  operator: NumberOperator;
  value: string;
};

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

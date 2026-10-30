import type { CartConditionField, NumberOperator } from "../engine";
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

/** One zone's price, in subunits of the shop's currency. */
export type ZonePrice = { zoneId: string; price: number };

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
  prices: ZonePrice[]; // zones without a price don't get this rate
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
  prices: Record<string, string>; // zoneId → typed price ("" = not offered)
};

/** What the rule edit action returns to the page. */
export type RuleActionResult =
  | { ok: true; intent: "save" | "delete" }
  | { ok: false; errors: RuleError[] }
  | { ok: false; invalid: true };

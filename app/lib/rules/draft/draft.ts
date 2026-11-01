import {
  CART_CONDITION_FIELDS,
  NUMBER_OPERATORS,
  RULE_MATCH,
  RULE_STATUS,
} from "../../engine";
import {
  RATE_PRESETS,
  RULE_MATCHES,
  type Rule,
  type RuleDraft,
  type RuleInput,
  type RatePreset,
} from "../types";
import { conditionToDraft, draftToCondition } from "./condition-draft";
import {
  draftToPricing,
  isZonePricingDraft,
  pricingToDraft,
} from "./pricing-draft";
import { RATE_PRESET } from "../constants";

export const emptyRuleDraft = (): RuleDraft => ({
  name: "",
  status: RULE_STATUS.ACTIVE,
  preset: RATE_PRESET.STANDARD,
  customName: "",
  minDeliveryDays: "",
  maxDeliveryDays: "",
  prices: {},
  match: RULE_MATCH.ALL,
  conditions: [],
});

/** A saved rule → the editable text the form shows. */
export function ruleToDraft(rule: Rule, currency: string): RuleDraft {
  return {
    name: rule.name,
    status: rule.status,
    preset: rule.preset ?? "custom",
    customName: rule.customName,
    minDeliveryDays: rule.minDeliveryDays?.toString() ?? "",
    maxDeliveryDays: rule.maxDeliveryDays?.toString() ?? "",
    prices: Object.fromEntries(
      rule.prices.map((p) => [p.zoneId, pricingToDraft(p, currency)]),
    ),
    match: rule.match,
    conditions: rule.conditions.map((c) => conditionToDraft(c, currency)),
  };
}

/**
 * The form's text → a rule to validate and save. Zones that aren't offered are left
 * out; text that isn't a number becomes NaN so validation can flag it.
 */
export function draftToInput(draft: RuleDraft, currency: string): RuleInput {
  const prices = Object.entries(draft.prices).flatMap(([zoneId, zone]) => {
    const pricing = draftToPricing(zoneId, zone, currency);
    return pricing ? [pricing] : [];
  });

  return {
    name: draft.name,
    status: draft.status,
    preset: draft.preset === "custom" ? null : draft.preset,
    customName: draft.preset === "custom" ? draft.customName : "",
    minDeliveryDays: toDays(draft.minDeliveryDays),
    maxDeliveryDays: toDays(draft.maxDeliveryDays),
    prices,
    match: draft.match,
    conditions: draft.conditions.map((c) => draftToCondition(c, currency)),
  };
}

/** "" → null, "3" → 3, anything else → NaN. */
function toDays(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === "") return null;
  return /^\d+$/.test(trimmed) ? Number(trimmed) : Number.NaN;
}

/** Reads the draft the edit page posts (as JSON); null if the shape is wrong. */
export function parseRuleDraft(raw: unknown): RuleDraft | null {
  if (typeof raw !== "string") return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const d = value as Record<string, unknown>;

  const strings = [
    "name",
    "customName",
    "minDeliveryDays",
    "maxDeliveryDays",
  ] as const;
  if (strings.some((key) => typeof d[key] !== "string")) return null;
  if (d.status !== RULE_STATUS.ACTIVE && d.status !== RULE_STATUS.INACTIVE)
    return null;
  if (d.preset !== "custom" && !RATE_PRESETS.includes(d.preset as RatePreset))
    return null;

  const prices = d.prices;
  if (!prices || typeof prices !== "object" || Array.isArray(prices))
    return null;
  if (!Object.values(prices).every(isZonePricingDraft)) return null;

  if (!RULE_MATCHES.includes(d.match as RuleDraft["match"])) return null;
  if (!Array.isArray(d.conditions)) return null;
  if (!d.conditions.every(isConditionDraft)) return null;

  return value as RuleDraft;
}

/** One posted condition: a known field and number operator, and the value as text. */
function isConditionDraft(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const c = value as Record<string, unknown>;
  return (
    (CART_CONDITION_FIELDS as readonly unknown[]).includes(c.field) &&
    (NUMBER_OPERATORS as readonly unknown[]).includes(c.operator) &&
    typeof c.value === "string"
  );
}

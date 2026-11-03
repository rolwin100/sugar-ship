import type {
  CartTotals,
  ConditionCheck,
  ConditionResult,
  EngineCondition,
  EngineRule,
} from "../types";
import { checkCartCondition } from "./cart-condition";
import { CONDITION_SUBJECT, RULE_MATCH } from "../constants";

/** Hands each condition to the checker for its subject. */
function checkCondition(
  condition: EngineCondition,
  totals: CartTotals,
): ConditionResult {
  switch (condition.subject) {
    case CONDITION_SUBJECT.CART:
      return checkCartCondition(condition, totals);
    // PRODUCT (slice G) and ADDRESS postcode lists (slice H) come later.
    default:
      return {
        unsupported: `${condition.subject} conditions aren't supported yet`,
      };
  }
}

/**
 * Checks a rule's conditions against the cart totals, combining them with rule.match:
 *   ALL  — every condition is true
 *   ANY  — at least one is true
 *   NONE — none is true
 * No conditions means the rule always applies. A condition the engine can't check
 * yet (another subject, field or operator, or a bad value) makes the rule not match,
 * so a rate is never shown by mistake.
 */
export function checkConditions(
  rule: EngineRule,
  totals: CartTotals,
): ConditionCheck {
  if (rule.conditions.length === 0) return { matched: true };

  const results = [];
  for (const condition of rule.conditions) {
    const checked = checkCondition(condition, totals);
    if ("unsupported" in checked) {
      return {
        matched: false,
        reason: `unsupported condition: ${checked.unsupported}`,
        failure: { unsupported: true },
      };
    }
    results.push(checked);
  }

  switch (rule.match) {
    case RULE_MATCH.ALL: {
      const failed = results.find((r) => !r.result);
      return failed
        ? {
            matched: false,
            reason: `needs all conditions; ${failed.text} is false`,
            failure: { match: rule.match, conditions: [failed.checked] },
          }
        : { matched: true };
    }
    case RULE_MATCH.ANY:
      return results.some((r) => r.result)
        ? { matched: true }
        : {
            matched: false,
            reason: `needs any condition; none is true (${results.map((r) => r.text).join(", ")})`,
            failure: {
              match: rule.match,
              conditions: results.map((r) => r.checked),
            },
          };
    case RULE_MATCH.NONE: {
      const hit = results.find((r) => r.result);
      return hit
        ? {
            matched: false,
            reason: `needs no conditions true; ${hit.text} is true`,
            failure: { match: rule.match, conditions: [hit.checked] },
          }
        : { matched: true };
    }
  }
}

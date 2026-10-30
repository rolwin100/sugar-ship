import { cartTotals } from "../cart-totals";
import { checkConditions } from "../conditions";
import { priceRate } from "../pricing";
import { matchZone } from "../match-zone";
import type {
  EngineCart,
  EngineResult,
  EngineRule,
  EngineSettings,
  EngineZone,
  QuotedRate,
  TraceEntry,
} from "../types";

function inSchedule(rule: EngineRule, now: Date): boolean {
  if (rule.startsAt && now < rule.startsAt) return false;
  if (rule.endsAt && now >= rule.endsAt) return false;
  return true;
}

/**
 * Works out which rates to show for a cart.
 *
 * Rules run in priority order (lowest first). Inactive and out-of-schedule rules
 * are skipped. A matching exclusive rule stops all later rules.
 *
 * The address is matched to one zone up front; a matching rule only returns rates
 * for that zone.
 *
 * Conditions are checked against the cart totals; when a rule doesn't match, its
 * trace entry says why.
 *
 * Still to come: product and postcode conditions (2.6–2.7), all pricing modes
 * and adjustments (2.9–2.10), combining same-name rates (2.11).
 */
export function quote(
  cart: EngineCart,
  rules: EngineRule[],
  zones: EngineZone[],
  _settings: EngineSettings,
  now: Date = new Date(),
): EngineResult {
  const rates: QuotedRate[] = [];
  const trace: TraceEntry[] = [];
  const zone = matchZone(cart.destination, zones);
  const totals = cartTotals(cart);

  // Stable: equal priorities keep their original order.
  const ordered = rules
    .map((rule, index) => ({ rule, index }))
    .sort((a, b) => a.rule.priority - b.rule.priority || a.index - b.index)
    .map(({ rule }) => rule);

  let stoppedBy: EngineRule | null = null;

  for (const rule of ordered) {
    const base = { ruleId: rule.id, ruleName: rule.name };

    if (stoppedBy) {
      trace.push({
        ...base,
        outcome: "skipped_after_exclusive",
        detail: `exclusive rule "${stoppedBy.name}" matched first`,
      });
      continue;
    }
    if (rule.status !== "ACTIVE") {
      trace.push({ ...base, outcome: "skipped_inactive" });
      continue;
    }
    if (!inSchedule(rule, now)) {
      trace.push({ ...base, outcome: "skipped_schedule" });
      continue;
    }
    const conditions = checkConditions(rule, totals);
    if (!conditions.matched) {
      trace.push({
        ...base,
        outcome: "not_matched",
        ...(conditions.reason ? { detail: conditions.reason } : {}),
      });
      continue;
    }

    const notes: string[] = [];
    if (!zone) notes.push("address is not in any zone");
    for (const rate of rule.rates) {
      if (!zone) continue;
      if (rate.zoneId !== zone.id) {
        notes.push(
          `rate ${rate.id}: for another zone (address is in "${zone.name}")`,
        );
        continue;
      }
      const priced = priceRate(rate, cart);
      if (!priced.ok) {
        notes.push(`rate ${rate.id}: ${priced.reason}`);
        continue;
      }
      rates.push({
        rateId: rate.id,
        ruleId: rule.id,
        zoneId: rate.zoneId,
        preset: rate.preset,
        name: rate.name,
        description: rate.description,
        minDeliveryDays: rate.minDeliveryDays,
        maxDeliveryDays: rate.maxDeliveryDays,
        price: priced.price,
      });
    }

    trace.push({
      ...base,
      outcome: "matched",
      ...(notes.length > 0 ? { detail: notes.join("; ") } : {}),
    });

    if (rule.exclusive) stoppedBy = rule;
  }

  return { rates, trace };
}

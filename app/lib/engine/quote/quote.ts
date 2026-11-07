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
  TraceReason,
} from "../types";
import { RULE_STATUS, TRACE_OUTCOME, TRACE_REASON } from "../constants";

function inSchedule(rule: EngineRule, now: Date): boolean {
  if (rule.startsAt && now < rule.startsAt) return false;
  if (rule.endsAt && now >= rule.endsAt) return false;
  return true;
}

/** Why a matching rule gave no rate, most specific first. */
function noRateReason(
  zone: EngineZone | null,
  notPriced: boolean,
): TraceReason {
  if (!zone) return { kind: TRACE_REASON.NO_ZONE };
  if (notPriced) return { kind: TRACE_REASON.NOT_PRICED };
  return { kind: TRACE_REASON.NOT_IN_ZONE, zoneName: zone.name };
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
 * Still to come: product and postcode conditions (2.6–2.7), adjustments (2.10),
 * combining same-name rates (2.11).
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
        outcome: TRACE_OUTCOME.SKIPPED_AFTER_EXCLUSIVE,
        detail: `exclusive rule "${stoppedBy.name}" matched first`,
        reason: {
          kind: TRACE_REASON.AFTER_EXCLUSIVE,
          ruleName: stoppedBy.name,
        },
      });
      continue;
    }
    if (rule.status !== RULE_STATUS.ACTIVE) {
      trace.push({
        ...base,
        outcome: TRACE_OUTCOME.SKIPPED_INACTIVE,
        reason: { kind: TRACE_REASON.INACTIVE },
      });
      continue;
    }
    if (!inSchedule(rule, now)) {
      trace.push({
        ...base,
        outcome: TRACE_OUTCOME.SKIPPED_SCHEDULE,
        reason: { kind: TRACE_REASON.OUT_OF_SCHEDULE },
      });
      continue;
    }
    const conditions = checkConditions(rule, totals, cart.items);
    if (!conditions.matched) {
      trace.push({
        ...base,
        outcome: TRACE_OUTCOME.NOT_MATCHED,
        ...(conditions.reason ? { detail: conditions.reason } : {}),
        reason: {
          kind: TRACE_REASON.CONDITIONS,
          failure: conditions.failure ?? { unsupported: true },
        },
      });
      continue;
    }

    const notes: string[] = [];
    const ratesBefore = rates.length;
    let notPriced = false;
    if (!zone) notes.push("address is not in any zone");
    for (const rate of rule.rates) {
      if (!zone) continue;
      if (rate.zoneId !== zone.id) {
        notes.push(
          `rate ${rate.id}: for another zone (address is in "${zone.name}")`,
        );
        continue;
      }
      const priced = priceRate(rate, totals);
      if (!priced.ok) {
        notes.push(`rate ${rate.id}: ${priced.reason}`);
        notPriced = true;
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

    const reason =
      rates.length > ratesBefore ? undefined : noRateReason(zone, notPriced);

    trace.push({
      ...base,
      outcome: TRACE_OUTCOME.MATCHED,
      ...(notes.length > 0 ? { detail: notes.join("; ") } : {}),
      ...(reason ? { reason } : {}),
    });

    if (rule.exclusive) stoppedBy = rule;
  }

  return { rates, trace };
}

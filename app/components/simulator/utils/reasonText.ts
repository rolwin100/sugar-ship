import type { TFunction } from "i18next";
import type {
  CartConditionField,
  CheckedCondition,
  TraceReason,
} from "../../../lib/engine";
import { formatMoney } from "../../../lib/money";
import { gramsToKg } from "../../../lib/weight";
import {
  CART_CONDITION_FIELD,
  RULE_MATCH,
  TRACE_REASON,
} from "../../../lib/engine";
import {
  CONDITION_FIELD_KEYS,
  CONDITION_OPERATOR_KEYS,
} from "../../rates/utils";

type Format = { t: TFunction; currency: string; locale: string };

/** A cart amount in its field's unit: "₹1,000.00", "2.5 kg", "3 items". */
export function amountText(
  field: CartConditionField,
  value: number,
  { t, currency, locale }: Format,
): string {
  switch (field) {
    case CART_CONDITION_FIELD.SUBTOTAL:
      return formatMoney(value, currency, locale);
    case CART_CONDITION_FIELD.WEIGHT:
      return t("simulator.kg", { value: gramsToKg(value) });
    case CART_CONDITION_FIELD.QUANTITY:
      return t("simulator.items", { count: value });
  }
}

/** "Cart subtotal is at least ₹2,500.00 (this cart: ₹1,000.00)". */
function conditionText(checked: CheckedCondition, format: Format): string {
  const { t } = format;
  return t("simulator.conditionWithActual", {
    field: t(CONDITION_FIELD_KEYS[checked.field]),
    operator: t(CONDITION_OPERATOR_KEYS[checked.operator]),
    value: amountText(checked.field, checked.value, format),
    actual: amountText(checked.field, checked.actual, format),
  });
}

/** Why a rate didn't show, as one sentence in the admin's language. */
export function reasonText(reason: TraceReason, format: Format): string {
  const { t } = format;
  switch (reason.kind) {
    case TRACE_REASON.INACTIVE:
      return t("simulator.reasonInactive");
    case TRACE_REASON.OUT_OF_SCHEDULE:
      return t("simulator.reasonOutOfSchedule");
    case TRACE_REASON.AFTER_EXCLUSIVE:
      return t("simulator.reasonAfterExclusive", { name: reason.ruleName });
    case TRACE_REASON.NO_ZONE:
      return t("simulator.reasonNoZone");
    case TRACE_REASON.NOT_IN_ZONE:
      return t("simulator.reasonNotInZone", { zone: reason.zoneName });
    case TRACE_REASON.NOT_PRICED:
      return t("simulator.reasonNotPriced");
    case TRACE_REASON.CONDITIONS: {
      const { failure } = reason;
      if ("unsupported" in failure) return t("simulator.reasonUnsupported");
      const conditions = failure.conditions.map((c) =>
        conditionText(c, format),
      );
      switch (failure.match) {
        case RULE_MATCH.ALL:
          return t("simulator.reasonNeeds", { condition: conditions[0] });
        case RULE_MATCH.ANY:
          return t("simulator.reasonNeedsAny", {
            conditions: conditions.join(t("simulator.orSeparator")),
          });
        case RULE_MATCH.NONE:
          return t("simulator.reasonMustNot", { condition: conditions[0] });
      }
    }
  }
}

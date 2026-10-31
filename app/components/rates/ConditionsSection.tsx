import { useTranslation } from "react-i18next";
import type { RuleMatch } from "../../lib/engine";
import {
  addCondition,
  removeCondition,
  replaceConditionField,
  replaceConditionOperator,
  replaceConditionValue,
} from "../../lib/rules/edit-conditions";
import { RULE_MATCHES } from "../../lib/rules/types";
import { CONDITIONS_MAX } from "../../lib/rules/validate-rule";
import { fieldValue } from "../field-events";
import { ConditionRow } from "./ConditionRow";
import type { ConditionsSectionProps } from "./types";
import { CONDITION_MATCH_KEYS } from "./utils";

/** "When": the cart conditions that decide whether this rate applies. */
export function ConditionsSection({
  match,
  conditions,
  currency,
  errors,
  onMatchChange,
  onConditionsChange,
}: ConditionsSectionProps) {
  const { t } = useTranslation();
  const atLimit = conditions.length >= CONDITIONS_MAX;

  return (
    <s-section heading={t("rates.whenHeading")}>
      <s-stack gap="base">
        {conditions.length === 0 ? (
          <s-paragraph>
            <s-text color="subdued">{t("rates.whenAlways")}</s-text>
          </s-paragraph>
        ) : (
          <>
            <s-select
              label={t("rates.matchLabel")}
              value={match}
              onChange={(e) => onMatchChange(fieldValue(e) as RuleMatch)}
            >
              {RULE_MATCHES.map((m) => (
                <s-option key={m} value={m}>
                  {t(CONDITION_MATCH_KEYS[m])}
                </s-option>
              ))}
            </s-select>

            <s-stack gap="small-300">
              {conditions.map((condition, index) => (
                <ConditionRow
                  // Rows have no id of their own; position is their identity in the form.
                  key={index}
                  index={index}
                  condition={condition}
                  currency={currency}
                  error={errors.find((e) => e.index === index)}
                  onFieldChange={(field) =>
                    onConditionsChange((c) =>
                      replaceConditionField(c, index, field),
                    )
                  }
                  onOperatorChange={(operator) =>
                    onConditionsChange((c) =>
                      replaceConditionOperator(c, index, operator),
                    )
                  }
                  onValueChange={(value) =>
                    onConditionsChange((c) =>
                      replaceConditionValue(c, index, value),
                    )
                  }
                  onRemove={() =>
                    onConditionsChange((c) => removeCondition(c, index))
                  }
                />
              ))}
            </s-stack>
          </>
        )}

        <s-stack direction="inline" gap="base" alignItems="center">
          <s-button
            icon="plus"
            disabled={atLimit}
            onClick={() => onConditionsChange(addCondition)}
          >
            {t("rates.addCondition")}
          </s-button>
          {atLimit && (
            <s-text color="subdued">{t("rates.conditionsAtLimit")}</s-text>
          )}
        </s-stack>
      </s-stack>
    </s-section>
  );
}

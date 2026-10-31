import { useTranslation } from "react-i18next";
import type { RuleError } from "../../lib/rules/validate-rule";
import { ruleErrorMessage } from "./utils";

type Props = {
  errors: RuleError[];
  invalid: boolean;
  zoneNames: Record<string, string>;
};

/** All of the rule's errors in one list (fields also show their own). */
export function RuleErrorsBanner({ errors, invalid, zoneNames }: Props) {
  const { t } = useTranslation();
  if (errors.length === 0 && !invalid) return null;

  return (
    <s-banner tone="critical" heading={t("rates.errorsTitle")}>
      <s-unordered-list>
        {invalid && <s-list-item>{t("rates.errorInvalid")}</s-list-item>}
        {errors.map((error, i) => (
          <s-list-item key={i}>
            {ruleErrorMessage(error, t, zoneNames)}
          </s-list-item>
        ))}
      </s-unordered-list>
    </s-banner>
  );
}

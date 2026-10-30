import { useTranslation } from "react-i18next";
import { PRESET_KEYS } from "../../lib/rules/presets";
import type { Rule } from "../../lib/rules/types";

/** The rate's name as customers see it (preset names in the admin's language). */
export function CheckoutName({
  rule,
}: {
  rule: Pick<Rule, "preset" | "customName">;
}) {
  const { t } = useTranslation();
  return <>{rule.preset ? t(PRESET_KEYS[rule.preset]) : rule.customName}</>;
}

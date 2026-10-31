import { useTranslation } from "react-i18next";
import type { RuleError } from "../../lib/rules/validate-rule";
import { fieldChecked, fieldValue } from "../field-events";
import { ruleErrorMessage } from "./utils";

type Props = {
  name: string;
  nameError?: RuleError;
  active: boolean;
  onNameChange: (name: string) => void;
  onActiveChange: (active: boolean) => void;
};

export function RuleDetailsSection({
  name,
  nameError,
  active,
  onNameChange,
  onActiveChange,
}: Props) {
  const { t } = useTranslation();

  return (
    <s-section heading={t("rates.detailsHeading")}>
      <s-stack gap="base">
        <s-text-field
          label={t("rates.nameLabel")}
          details={t("rates.nameHelp")}
          value={name}
          error={nameError ? ruleErrorMessage(nameError, t, {}) : undefined}
          onInput={(e) => onNameChange(fieldValue(e))}
        />
        <s-switch
          label={t("rates.activeLabel")}
          details={t("rates.activeHelp")}
          checked={active}
          onChange={(e) => onActiveChange(fieldChecked(e))}
        />
      </s-stack>
    </s-section>
  );
}

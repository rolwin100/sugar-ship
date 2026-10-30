import { useTranslation } from "react-i18next";

export const DELETE_RULE_MODAL_ID = "delete-rule-modal";

type Props = { name: string; busy: boolean; onDelete: () => void };

export function DeleteRuleModal({ name, busy, onDelete }: Props) {
  const { t } = useTranslation();

  return (
    <s-modal
      id={DELETE_RULE_MODAL_ID}
      heading={t("rates.deleteTitle", { name })}
    >
      <s-paragraph>{t("rates.deleteBody")}</s-paragraph>
      <s-button
        slot="primary-action"
        variant="primary"
        tone="critical"
        loading={busy}
        commandFor={DELETE_RULE_MODAL_ID}
        command="--hide"
        onClick={onDelete}
      >
        {t("rates.deleteRate")}
      </s-button>
      <s-button
        slot="secondary-actions"
        commandFor={DELETE_RULE_MODAL_ID}
        command="--hide"
      >
        {t("common.cancel")}
      </s-button>
    </s-modal>
  );
}

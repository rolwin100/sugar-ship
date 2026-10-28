import { useTranslation } from "react-i18next";

export const DELETE_ZONE_MODAL_ID = "delete-zone-modal";

type Props = { name: string; rateCount: number; busy: boolean; onDelete: () => void };

/** Confirms deleting a zone; warns that its rates go too. */
export function DeleteZoneModal({ name, rateCount, busy, onDelete }: Props) {
  const { t } = useTranslation();

  return (
    <s-modal id={DELETE_ZONE_MODAL_ID} heading={t("zones.deleteTitle", { name })}>
      <s-paragraph>
        {rateCount > 0 ? t("zones.deleteBodyRates", { count: rateCount }) : t("zones.deleteBody")}
      </s-paragraph>
      <s-button
        slot="primary-action"
        variant="primary"
        tone="critical"
        loading={busy}
        commandFor={DELETE_ZONE_MODAL_ID}
        command="--hide"
        onClick={onDelete}
      >
        {t("zones.deleteZone")}
      </s-button>
      <s-button slot="secondary-actions" commandFor={DELETE_ZONE_MODAL_ID} command="--hide">
        {t("common.cancel")}
      </s-button>
    </s-modal>
  );
}

import { SaveBar } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";

type Props = { open: boolean; busy: boolean; onSave: () => void; onDiscard: () => void };

/** Shopify's save bar at the top of the admin; shown while the zone has unsaved changes. */
export function ZoneSaveBar({ open, busy, onSave, onDiscard }: Props) {
  const { t } = useTranslation();

  return (
    <SaveBar id="zone-save-bar" open={open}>
      <button variant="primary" onClick={onSave} loading={busy ? "" : undefined} disabled={busy}>
        {t("common.save")}
      </button>
      <button onClick={onDiscard} disabled={busy}>
        {t("common.discard")}
      </button>
    </SaveBar>
  );
}

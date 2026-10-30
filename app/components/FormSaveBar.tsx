import { SaveBar } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";

type Props = {
  id: string;
  open: boolean;
  busy: boolean;
  onSave: () => void;
  onDiscard: () => void;
};

/** Shopify's save bar at the top of the admin; shown while a form has unsaved changes. */
export function FormSaveBar({ id, open, busy, onSave, onDiscard }: Props) {
  const { t } = useTranslation();

  return (
    <SaveBar id={id} open={open}>
      <button
        variant="primary"
        onClick={onSave}
        loading={busy ? "" : undefined}
        disabled={busy}
      >
        {t("common.save")}
      </button>
      <button onClick={onDiscard} disabled={busy}>
        {t("common.discard")}
      </button>
    </SaveBar>
  );
}

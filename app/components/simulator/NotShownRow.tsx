import { useTranslation } from "react-i18next";
import type { NotShownRowProps } from "./types";
import { reasonText } from "./utils";

/** A rate customers wouldn't see, and why. */
export function NotShownRow({ rate, currency }: NotShownRowProps) {
  const { t, i18n } = useTranslation();
  return (
    <s-grid gridTemplateColumns="1fr 2fr" gap="small-200" alignItems="start">
      <s-text type="strong">{rate.ruleName}</s-text>
      <s-text color="subdued">
        {reasonText(rate.reason, { t, currency, locale: i18n.language })}
      </s-text>
    </s-grid>
  );
}

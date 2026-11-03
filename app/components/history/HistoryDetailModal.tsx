import { useTranslation } from "react-i18next";
import { formatMoney } from "../../lib/money";
import { gramsToKg } from "../../lib/weight";
import type { HistoryDetailModalProps } from "./types";
import {
  arrivalText,
  cartText,
  destinationText,
  outcomeBadge,
  timeText,
} from "./utils";

export const HISTORY_DETAIL_MODAL_ID = "history-detail-modal";

/** One checkout in full: address, cart lines and the rates we returned. */
export function HistoryDetailModal({ item }: HistoryDetailModalProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const money = (subunits: number) =>
    item ? formatMoney(subunits, item.currency, locale) : "";
  const badge = item ? outcomeBadge(item.outcome, item.rates.length, t) : null;

  return (
    <s-modal
      id={HISTORY_DETAIL_MODAL_ID}
      size="large"
      heading={item ? timeText(item.createdAt, locale) : t("history.title")}
    >
      {item && badge && (
        <s-stack gap="base">
          <s-stack direction="inline" gap="small-200" alignItems="center">
            <s-badge tone={badge.tone}>{badge.label}</s-badge>
            <s-badge>
              {t(item.testMode ? "history.test" : "history.live")}
            </s-badge>
            <s-text color="subdued">
              {t("history.answeredIn", { ms: item.durationMs })}
            </s-text>
          </s-stack>
          {item.error && <s-text tone="critical">{item.error}</s-text>}

          <s-stack gap="small-100">
            <s-heading>{t("history.addressHeading")}</s-heading>
            <s-text>
              {[
                destinationText(item.destination, locale),
                item.destination.postcode,
              ]
                .filter(Boolean)
                .join(" · ") || "–"}
            </s-text>
          </s-stack>

          <s-stack gap="small-100">
            <s-heading>{t("history.cartHeading")}</s-heading>
            <s-text color="subdued">{cartText(item, t, locale)}</s-text>
            <s-table>
              <s-table-header-row>
                <s-table-header listSlot="primary">
                  {t("history.colProduct")}
                </s-table-header>
                <s-table-header listSlot="secondary">
                  {t("history.colSku")}
                </s-table-header>
                <s-table-header listSlot="inline" format="numeric">
                  {t("history.colQuantity")}
                </s-table-header>
                <s-table-header listSlot="labeled" format="numeric">
                  {t("history.colWeight")}
                </s-table-header>
                <s-table-header listSlot="labeled" format="numeric">
                  {t("history.colPrice")}
                </s-table-header>
              </s-table-header-row>
              <s-table-body>
                {item.lines.map((line, index) => (
                  // Lines have no id of their own; position is their identity.
                  <s-table-row key={index}>
                    <s-table-cell>{line.name || "–"}</s-table-cell>
                    <s-table-cell>{line.sku ?? "–"}</s-table-cell>
                    <s-table-cell>{line.quantity}</s-table-cell>
                    <s-table-cell>
                      {t("history.kg", { value: gramsToKg(line.grams) })}
                    </s-table-cell>
                    <s-table-cell>{money(line.price)}</s-table-cell>
                  </s-table-row>
                ))}
              </s-table-body>
            </s-table>
          </s-stack>

          <s-stack gap="small-200">
            <s-heading>{t("history.ratesHeading")}</s-heading>
            {item.rates.length === 0 ? (
              <s-text color="subdued">{t("history.noRatesReturned")}</s-text>
            ) : (
              item.rates.map((rate, index) => {
                const arrives = arrivalText(
                  rate.minDeliveryDate,
                  rate.maxDeliveryDate,
                  t,
                  locale,
                );
                return (
                  <s-grid
                    // Rates have no id of their own; position is their identity.
                    key={index}
                    gridTemplateColumns="1fr auto"
                    gap="small-200"
                    alignItems="start"
                  >
                    <s-stack gap="small-100">
                      <s-text type="strong">{rate.name}</s-text>
                      {rate.description && <s-text>{rate.description}</s-text>}
                      {arrives && <s-text color="subdued">{arrives}</s-text>}
                    </s-stack>
                    <s-text type="strong">{money(rate.price)}</s-text>
                  </s-grid>
                );
              })
            )}
          </s-stack>
        </s-stack>
      )}
      <s-button
        slot="secondary-actions"
        commandFor={HISTORY_DETAIL_MODAL_ID}
        command="--hide"
      >
        {t("history.close")}
      </s-button>
    </s-modal>
  );
}

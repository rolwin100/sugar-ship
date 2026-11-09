import { useTranslation } from "react-i18next";
import { formatMoney } from "../../lib/money";
import { NotShownRow } from "./NotShownRow";
import { ShownRateRow } from "./ShownRateRow";
import type { SimulationResultSectionProps } from "./types";

/** What customers would see for the tested cart, and why the other rates don't show. */
export function SimulationResultSection({
  result,
  currency,
  fallback,
}: SimulationResultSectionProps) {
  const { t, i18n } = useTranslation();

  return (
    <s-section heading={t("simulator.resultHeading")}>
      <s-stack gap="base">
        <s-paragraph>
          {result.zoneName
            ? t("simulator.inZone", { zone: result.zoneName })
            : t("simulator.noZone")}
        </s-paragraph>

        {result.unsyncedProducts.length > 0 && (
          <s-banner tone="warning">
            {t("simulator.unsyncedNote", {
              products: result.unsyncedProducts.join(", "),
            })}
          </s-banner>
        )}

        <s-stack gap="small-200">
          <s-heading>{t("simulator.shownHeading")}</s-heading>
          {result.shown.length > 0 ? (
            result.shown.map((rate) => (
              <ShownRateRow
                key={`${rate.ruleId}-${rate.zoneId}`}
                rate={rate}
                currency={currency}
              />
            ))
          ) : (
            <s-stack gap="small-100">
              <s-text>{t("simulator.noneShown")}</s-text>
              <s-text color="subdued">
                {fallback
                  ? t("simulator.fallbackShown", {
                      name: fallback.name,
                      price: formatMoney(
                        fallback.price,
                        currency,
                        i18n.language,
                      ),
                    })
                  : t("simulator.noFallback")}
              </s-text>
            </s-stack>
          )}
        </s-stack>

        {result.notShown.length > 0 && (
          <s-stack gap="small-200">
            <s-divider />
            <s-heading>{t("simulator.notShownHeading")}</s-heading>
            {result.notShown.map((rate) => (
              <NotShownRow key={rate.ruleId} rate={rate} currency={currency} />
            ))}
          </s-stack>
        )}
      </s-stack>
    </s-section>
  );
}

import { useTranslation } from "react-i18next";
import { emptyZonePricingDraft } from "../../../lib/rules/draft";
import type { ZonePricingDraft } from "../../../lib/rules/types";
import type { RuleError } from "../../../lib/rules/validate-rule";
import type { Zone } from "../../../lib/zones/types";
import type { ZonePricingCardProps } from "../types";
import { ZonePricingCard } from "./ZonePricingCard";

type Props = {
  zones: Zone[];
  prices: Record<string, ZonePricingDraft>; // zoneId → pricing
  currency: string;
  errors: RuleError[]; // price errors, each with a zoneId
  onPricesChange: ZonePricingCardProps["onPricesChange"];
};

/** One card per zone: whether the rate is offered there and how it's priced. */
export function ZonePricesSection({
  zones,
  prices,
  currency,
  errors,
  onPricesChange,
}: Props) {
  const { t } = useTranslation();
  const zoneNames = Object.fromEntries(zones.map((z) => [z.id, z.name]));

  return (
    <s-section heading={t("rates.pricesHeading")}>
      <s-stack gap="base">
        <s-paragraph>
          <s-text color="subdued">{t("rates.pricesHelp")}</s-text>
        </s-paragraph>
        {zones.length === 0 ? (
          <s-paragraph>
            <s-link href="/app/zones">{t("rates.goToZones")}</s-link>
          </s-paragraph>
        ) : (
          zones.map((zone) => (
            <ZonePricingCard
              key={zone.id}
              zone={zone}
              pricing={prices[zone.id] ?? emptyZonePricingDraft()}
              currency={currency}
              errors={errors.filter((e) => e.zoneId === zone.id)}
              zoneNames={zoneNames}
              onPricesChange={onPricesChange}
            />
          ))
        )}
      </s-stack>
    </s-section>
  );
}

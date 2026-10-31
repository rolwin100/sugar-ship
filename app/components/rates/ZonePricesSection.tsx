import { useTranslation } from "react-i18next";
import type { RuleError } from "../../lib/rules/validate-rule";
import type { Zone } from "../../lib/zones/types";
import { fieldValue } from "../field-events";
import { ZoneCoverage } from "../zones/ZoneCoverage";
import { ruleErrorMessage } from "./utils";

type Props = {
  zones: Zone[];
  prices: Record<string, string>; // zoneId → typed price
  currency: string;
  errors: RuleError[]; // price errors, each with a zoneId
  onPriceChange: (zoneId: string, price: string) => void;
};

/** One price field per zone; empty means the rate isn't offered there. */
export function ZonePricesSection({
  zones,
  prices,
  currency,
  errors,
  onPriceChange,
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
          zones.map((zone) => {
            const error = errors.find((e) => e.zoneId === zone.id);
            return (
              <s-stack key={zone.id} gap="small-100">
                <s-money-field
                  label={zone.name}
                  currencyCode={currency as never}
                  placeholder={t("rates.notOffered")}
                  min={0}
                  value={prices[zone.id] ?? ""}
                  error={
                    error ? ruleErrorMessage(error, t, zoneNames) : undefined
                  }
                  onInput={(e) => onPriceChange(zone.id, fieldValue(e))}
                />
                <s-text color="subdued">
                  <ZoneCoverage zone={{ ...zone, rateCount: 0 }} />
                </s-text>
              </s-stack>
            );
          })
        )}
      </s-stack>
    </s-section>
  );
}

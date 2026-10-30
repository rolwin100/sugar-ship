import { useTranslation } from "react-i18next";
import type { Rule } from "../../lib/rules/types";
import { CheckoutName } from "./CheckoutName";
import { RatePrices } from "./RatePrices";

type Props = {
  rule: Rule;
  zoneNames: Record<string, string>;
  currency: string;
};

export function RateRow({ rule, zoneNames, currency }: Props) {
  const { t } = useTranslation();
  const active = rule.status === "ACTIVE";

  return (
    <s-table-row clickDelegate={`rate-link-${rule.id}`}>
      <s-table-cell>
        <s-link id={`rate-link-${rule.id}`} href={`/app/rates/${rule.id}`}>
          {rule.name}
        </s-link>
      </s-table-cell>
      <s-table-cell>
        <CheckoutName rule={rule} />
      </s-table-cell>
      <s-table-cell>
        <RatePrices
          prices={rule.prices}
          zoneNames={zoneNames}
          currency={currency}
        />
      </s-table-cell>
      <s-table-cell>
        <s-badge tone={active ? "success" : "neutral"}>
          {t(active ? "rates.statusActive" : "rates.statusInactive")}
        </s-badge>
      </s-table-cell>
    </s-table-row>
  );
}

import { useTranslation } from "react-i18next";
import type { Rule } from "../../../lib/rules/types";
import { RateRow } from "./RateRow";

type Props = {
  rules: Rule[];
  zoneNames: Record<string, string>;
  currency: string;
};

export function RatesTable({ rules, zoneNames, currency }: Props) {
  const { t } = useTranslation();

  return (
    <s-section padding="none">
      <s-table>
        <s-table-header-row>
          <s-table-header listSlot="primary">
            {t("rates.colName")}
          </s-table-header>
          <s-table-header listSlot="secondary">
            {t("rates.colCheckout")}
          </s-table-header>
          <s-table-header listSlot="labeled">
            {t("rates.colPrices")}
          </s-table-header>
          <s-table-header listSlot="inline">
            {t("rates.colStatus")}
          </s-table-header>
        </s-table-header-row>
        <s-table-body>
          {rules.map((rule) => (
            <RateRow
              key={rule.id}
              rule={rule}
              zoneNames={zoneNames}
              currency={currency}
            />
          ))}
        </s-table-body>
      </s-table>
    </s-section>
  );
}

import { useTranslation } from "react-i18next";
import type { ZoneListItem } from "../../../lib/zones/types";
import { ZoneRow } from "./ZoneRow";

export function ZonesTable({ zones }: { zones: ZoneListItem[] }) {
  const { t } = useTranslation();

  return (
    <s-section padding="none">
      <s-table>
        <s-table-header-row>
          <s-table-header listSlot="primary">
            {t("zones.colName")}
          </s-table-header>
          <s-table-header listSlot="secondary">
            {t("zones.colCovers")}
          </s-table-header>
          <s-table-header listSlot="inline" format="numeric">
            {t("zones.colRates")}
          </s-table-header>
        </s-table-header-row>
        <s-table-body>
          {zones.map((zone) => (
            <ZoneRow key={zone.id} zone={zone} />
          ))}
        </s-table-body>
      </s-table>
    </s-section>
  );
}

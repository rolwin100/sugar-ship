import type { ZoneListItem } from "../../../lib/zones/types";
import { ZoneCoverage } from "../ZoneCoverage";

export function ZoneRow({ zone }: { zone: ZoneListItem }) {
  return (
    <s-table-row clickDelegate={`zone-link-${zone.id}`}>
      <s-table-cell>
        <s-link id={`zone-link-${zone.id}`} href={`/app/zones/${zone.id}`}>
          {zone.name}
        </s-link>
      </s-table-cell>
      <s-table-cell>
        <ZoneCoverage zone={zone} />
      </s-table-cell>
      <s-table-cell>{zone.rateCount}</s-table-cell>
    </s-table-row>
  );
}

import { useTranslation } from "react-i18next";
import { normCountry } from "../../lib/zones/codes";
import type { TakenIndex } from "../../lib/zones/taken";
import type { Region } from "../../lib/zones/types";
import { COUNTRIES_MODAL_ID } from "./CountriesModal";
import { RegionRow } from "./RegionRow";

type Props = {
  regions: Region[];
  taken: TakenIndex;
  onRemove: (country: string) => void;
  onWholeChange: (country: string, whole: boolean) => void;
  onChooseStates: (country: string) => void;
};

export function ZoneRegionsSection({ regions, taken, onRemove, onWholeChange, onChooseStates }: Props) {
  const { t } = useTranslation();

  return (
    <s-section heading={t("zones.countriesHeading")}>
      <s-button slot="secondary-actions" commandFor={COUNTRIES_MODAL_ID} command="--show">
        {t("zones.addCountries")}
      </s-button>

      {regions.length === 0 ? (
        <s-paragraph>
          <s-text color="subdued">{t("zones.noCountries")}</s-text>
        </s-paragraph>
      ) : (
        <s-stack gap="base">
          {regions.map((region, index) => {
            const code = normCountry(region.country);
            return (
              <s-stack key={code} gap="base">
                {index > 0 && <s-divider />}
                <RegionRow
                  region={region}
                  wholeTaken={taken.whole.has(code)}
                  onRemove={() => onRemove(code)}
                  onWholeChange={(whole) => onWholeChange(code, whole)}
                  onChooseStates={() => onChooseStates(code)}
                />
              </s-stack>
            );
          })}
        </s-stack>
      )}
    </s-section>
  );
}

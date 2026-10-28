import { useTranslation } from "react-i18next";
import { countryName, hasStates, listStates } from "../../lib/geo/geo";
import type { Region } from "../../lib/zones/types";
import { fieldValues } from "../field-events";
import { STATES_MODAL_ID } from "./StatesModal";

type Props = {
  region: Region;
  /** Another zone has this whole country, so this zone can only take some of its states. */
  wholeTaken: boolean;
  onRemove: () => void;
  onWholeChange: (whole: boolean) => void;
  onChooseStates: () => void;
};

/** One country in the zone: whole country or selected states. */
export function RegionRow({ region, wholeTaken, onRemove, onWholeChange, onChooseStates }: Props) {
  const { t, i18n } = useTranslation();
  const name = countryName(region.country, i18n.language);

  return (
    <s-stack gap="small-200">
      <s-stack direction="inline" justifyContent="space-between" alignItems="center">
        <s-text type="strong">{name}</s-text>
        <s-button variant="tertiary" onClick={onRemove}>
          {t("zones.remove")}
        </s-button>
      </s-stack>

      {hasStates(region.country) && (
        <>
          <s-choice-list
            label={name}
            labelAccessibilityVisibility="exclusive"
            values={[region.provinces === null ? "whole" : "states"]}
            onChange={(e) => onWholeChange(fieldValues(e)[0] === "whole")}
          >
            <s-choice value="whole" disabled={wholeTaken}>
              {t("zones.wholeCountry")}
            </s-choice>
            <s-choice value="states">{t("zones.selectedStates")}</s-choice>
          </s-choice-list>

          {region.provinces !== null && (
            <s-stack direction="inline" gap="base" alignItems="center">
              <s-text color="subdued">
                {t("zones.statesCount", {
                  count: region.provinces.length,
                  total: listStates(region.country).length,
                })}
              </s-text>
              <s-button commandFor={STATES_MODAL_ID} command="--show" onClick={onChooseStates}>
                {t("zones.chooseStates")}
              </s-button>
            </s-stack>
          )}
        </>
      )}
    </s-stack>
  );
}

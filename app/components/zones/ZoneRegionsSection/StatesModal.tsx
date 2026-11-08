import { useState } from "react";
import { useTranslation } from "react-i18next";
import { countryName, listStates } from "../../../lib/geo/geo";
import { normState } from "../../../lib/zones/codes";
import type { TakenIndex } from "../../../lib/zones/taken";
import { fieldChecked, fieldValue } from "../../field-events";

export const STATES_MODAL_ID = "states-modal";

type Props = {
  /** The country being edited, or null when the modal isn't in use. */
  country: string | null;
  /** State codes currently in this zone for that country. */
  selected: string[];
  taken: TakenIndex;
  onToggle: (state: string, on: boolean) => void;
  onSetAll: (states: string[]) => void;
};

/** Pick states for one country. States used by another zone are disabled. */
export function StatesModal({
  country,
  selected,
  taken,
  onToggle,
  onSetAll,
}: Props) {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState("");

  const states = country ? listStates(country) : [];
  const selectedSet = new Set(selected.map(normState));
  const usedElsewhere =
    (country && taken.states.get(country)) || new Map<string, string>();

  const query = search.trim().toLocaleLowerCase();
  const shown = query
    ? states.filter((s) => s.name.toLocaleLowerCase().includes(query))
    : states;

  return (
    <s-modal
      id={STATES_MODAL_ID}
      heading={
        country
          ? t("zones.statesTitle", {
              country: countryName(country, i18n.language),
            })
          : ""
      }
      onHide={() => setSearch("")}
    >
      {country && (
        <s-stack gap="base">
          <s-search-field
            label={t("zones.searchStates")}
            labelAccessibilityVisibility="exclusive"
            placeholder={t("zones.searchStates")}
            value={search}
            onInput={(e) => setSearch(fieldValue(e))}
          />
          <s-stack direction="inline" gap="small-200">
            <s-button
              variant="tertiary"
              onClick={() =>
                onSetAll(
                  states
                    .filter((s) => !usedElsewhere.has(normState(s.code)))
                    .map((s) => s.code),
                )
              }
            >
              {t("zones.selectAll")}
            </s-button>
            <s-button variant="tertiary" onClick={() => onSetAll([])}>
              {t("zones.clear")}
            </s-button>
          </s-stack>
          <s-stack gap="small-200">
            {shown.map((state) => {
              const usedBy = usedElsewhere.get(normState(state.code));
              const checked = selectedSet.has(normState(state.code));
              return (
                <s-checkbox
                  key={state.code}
                  label={state.name}
                  details={
                    usedBy ? t("zones.inZone", { zone: usedBy }) : undefined
                  }
                  checked={checked}
                  disabled={Boolean(usedBy) && !checked}
                  onChange={(e) => onToggle(state.code, fieldChecked(e))}
                />
              );
            })}
          </s-stack>
        </s-stack>
      )}
      <s-button
        slot="primary-action"
        variant="primary"
        commandFor={STATES_MODAL_ID}
        command="--hide"
      >
        {t("common.done")}
      </s-button>
    </s-modal>
  );
}

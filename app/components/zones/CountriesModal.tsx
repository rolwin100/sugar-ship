import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { hasStates, listCountries } from "../../lib/geo/geo";
import { takenBy, type TakenIndex } from "../../lib/zones/taken";
import { fieldChecked, fieldValue } from "../field-events";

export const COUNTRIES_MODAL_ID = "countries-modal";

type Props = {
  /** Country codes already in this zone. */
  selected: Set<string>;
  taken: TakenIndex;
  onToggle: (country: string, on: boolean) => void;
};

/** Pick countries; ticking one adds it to the zone straight away. */
export function CountriesModal({ selected, taken, onToggle }: Props) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const [search, setSearch] = useState("");
  const countries = useMemo(() => listCountries(locale), [locale]);

  const query = search.trim().toLocaleLowerCase(locale);
  const shown = query
    ? countries.filter(
        (c) => c.name.toLocaleLowerCase(locale).includes(query) || c.code.toLowerCase() === query,
      )
    : countries;

  return (
    <s-modal id={COUNTRIES_MODAL_ID} heading={t("zones.addCountries")} onHide={() => setSearch("")}>
      <s-stack gap="base">
        <s-search-field
          label={t("zones.searchCountries")}
          labelAccessibilityVisibility="exclusive"
          placeholder={t("zones.searchCountries")}
          value={search}
          onInput={(e) => setSearch(fieldValue(e))}
        />
        <s-stack gap="small-200">
          {shown.map((country) => {
            const usedBy = takenBy(taken, country.code);
            const isSelected = selected.has(country.code);
            // A whole country used elsewhere can still be added for some states, unless it has none.
            const blocked = taken.whole.has(country.code) && !hasStates(country.code);
            return (
              <s-checkbox
                key={country.code}
                label={country.name}
                details={usedBy ? t("zones.inZone", { zone: usedBy }) : undefined}
                checked={isSelected}
                disabled={blocked && !isSelected}
                onChange={(e) => onToggle(country.code, fieldChecked(e))}
              />
            );
          })}
        </s-stack>
      </s-stack>
      <s-button slot="primary-action" variant="primary" commandFor={COUNTRIES_MODAL_ID} command="--hide">
        {t("common.done")}
      </s-button>
    </s-modal>
  );
}

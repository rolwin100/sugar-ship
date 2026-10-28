import { normCountry, normState } from "./codes";
import type { Zone } from "./types";

/** Which whole countries and which states the other zones already use, and by which zone. */
export type TakenIndex = {
  /** country code → zone name */
  whole: Map<string, string>;
  /** country code → (state code without prefix → zone name) */
  states: Map<string, Map<string, string>>;
};

export function takenIndex(others: Pick<Zone, "name" | "restOfWorld" | "regions">[]): TakenIndex {
  const whole = new Map<string, string>();
  const states = new Map<string, Map<string, string>>();

  for (const zone of others) {
    if (zone.restOfWorld) continue;
    for (const region of zone.regions) {
      const country = normCountry(region.country);
      if (region.provinces === null) {
        whole.set(country, zone.name);
      } else {
        const byState = states.get(country) ?? new Map<string, string>();
        for (const p of region.provinces) byState.set(normState(p), zone.name);
        states.set(country, byState);
      }
    }
  }

  return { whole, states };
}

/** The zone using this country (whole, or any of its states), for "In Domestic" hints. */
export function takenBy(index: TakenIndex, country: string): string | undefined {
  const code = normCountry(country);
  return index.whole.get(code) ?? index.states.get(code)?.values().next().value;
}

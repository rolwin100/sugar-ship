import { describe, expect, it } from "vitest";
import type { Zone } from "./types";
import { parseZoneInput, validateZone, ZONE_NAME_MAX, type ZoneInput } from "./validate-zone";

const domestic: Zone = {
  id: "domestic",
  name: "Domestic",
  restOfWorld: false,
  regions: [{ country: "IN", provinces: null }],
};
const usWest: Zone = {
  id: "us-west",
  name: "US West",
  restOfWorld: false,
  regions: [{ country: "US", provinces: ["CA", "WA"] }],
};
const tokyo: Zone = {
  id: "tokyo",
  name: "Tokyo",
  restOfWorld: false,
  regions: [{ country: "JP", provinces: ["JP-13"] }],
};
const restOfWorld: Zone = { id: "row", name: "Rest of world", restOfWorld: true, regions: [] };

const input = (overrides: Partial<ZoneInput> = {}): ZoneInput => ({
  name: "Europe",
  restOfWorld: false,
  regions: [{ country: "FR", provinces: null }],
  ...overrides,
});

const errorKeys = (result: ReturnType<typeof validateZone>) =>
  result.ok ? [] : result.errors.map((e) => e.key);

describe("validateZone", () => {
  it("accepts a valid zone and cleans it up", () => {
    const result = validateZone(
      input({ name: "  Europe ", regions: [{ country: " fr ", provinces: null }] }),
      [domestic],
    );
    expect(result).toEqual({
      ok: true,
      zone: { name: "Europe", restOfWorld: false, regions: [{ country: "FR", provinces: null }] },
    });
  });

  it("requires a name of a sensible length", () => {
    expect(errorKeys(validateZone(input({ name: "   " }), []))).toEqual(["nameRequired"]);
    expect(errorKeys(validateZone(input({ name: "x".repeat(ZONE_NAME_MAX + 1) }), []))).toEqual([
      "nameTooLong",
    ]);
  });

  it("requires at least one country, and states when a country is limited to states", () => {
    expect(errorKeys(validateZone(input({ regions: [] }), []))).toEqual(["regionsRequired"]);
    expect(
      errorKeys(validateZone(input({ regions: [{ country: "US", provinces: [] }] }), [])),
    ).toEqual(["statesRequired"]);
  });

  it("merges repeated countries", () => {
    const states = validateZone(
      input({
        regions: [
          { country: "US", provinces: ["NY", "tx"] },
          { country: "us", provinces: ["TX", "FL"] },
        ],
      }),
      [],
    );
    expect(states.ok && states.zone.regions).toEqual([
      { country: "US", provinces: ["NY", "TX", "FL"] },
    ]);

    const whole = validateZone(
      input({
        regions: [
          { country: "US", provinces: ["NY"] },
          { country: "US", provinces: null },
        ],
      }),
      [],
    );
    expect(whole.ok && whole.zone.regions).toEqual([{ country: "US", provinces: null }]);
  });

  it("allows only one Rest of world zone, and clears its countries", () => {
    expect(validateZone(input({ name: "Everywhere else", restOfWorld: true }), [domestic])).toEqual({
      ok: true,
      zone: { name: "Everywhere else", restOfWorld: true, regions: [] },
    });
    const result = validateZone(input({ restOfWorld: true }), [restOfWorld]);
    expect(result.ok ? null : result.errors[0]).toMatchObject({
      key: "restOfWorldExists",
      zone: "Rest of world",
    });
  });

  it("blocks a whole country that is already in another zone", () => {
    const result = validateZone(input({ regions: [{ country: "IN", provinces: null }] }), [domestic]);
    expect(result.ok ? null : result.errors[0]).toMatchObject({
      key: "countryTaken",
      country: "IN",
      zone: "Domestic",
    });
  });

  it("blocks a state that is already in another zone, with or without a country prefix", () => {
    const us = validateZone(input({ regions: [{ country: "US", provinces: ["OR", "wa"] }] }), [
      usWest,
    ]);
    expect(us.ok ? null : us.errors[0]).toMatchObject({
      key: "stateTaken",
      state: "WA",
      zone: "US West",
    });

    const jp = validateZone(input({ regions: [{ country: "JP", provinces: ["13"] }] }), [tokyo]);
    expect(errorKeys(jp)).toEqual(["stateTaken"]);
  });

  it("allows states next to a whole-country zone (the most specific zone wins)", () => {
    const states = validateZone(input({ regions: [{ country: "IN", provinces: ["MH"] }] }), [
      domestic,
    ]);
    expect(states.ok).toBe(true);

    const whole = validateZone(input({ regions: [{ country: "US", provinces: null }] }), [usWest]);
    expect(whole.ok).toBe(true);
  });
});

describe("parseZoneInput", () => {
  it("reads a zone posted as JSON", () => {
    const zone = { name: "West", restOfWorld: false, regions: [{ country: "US", provinces: ["CA"] }, { country: "FR", provinces: null }] };
    expect(parseZoneInput(JSON.stringify(zone))).toEqual(zone);
  });

  it("rejects anything with the wrong shape", () => {
    expect(parseZoneInput(null)).toBeNull();
    expect(parseZoneInput("not json")).toBeNull();
    expect(parseZoneInput(JSON.stringify([]))).toBeNull();
    expect(parseZoneInput(JSON.stringify({ name: 1, restOfWorld: false, regions: [] }))).toBeNull();
    expect(parseZoneInput(JSON.stringify({ name: "x", restOfWorld: "no", regions: [] }))).toBeNull();
    expect(parseZoneInput(JSON.stringify({ name: "x", restOfWorld: false, regions: [{ country: 1, provinces: null }] }))).toBeNull();
    expect(parseZoneInput(JSON.stringify({ name: "x", restOfWorld: false, regions: [{ country: "US", provinces: [1] }] }))).toBeNull();
    expect(parseZoneInput(JSON.stringify({ name: "x", restOfWorld: false, regions: [{ country: "US" }] }))).toBeNull();
  });
});

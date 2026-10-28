import { describe, expect, it } from "vitest";
import {
  addCountry,
  removeCountry,
  replaceCountryStates,
  toggleCountryState,
  updateRegion,
} from "./edit-regions";
import { takenIndex } from "./taken";
import type { Region } from "./types";

const nothingTaken = takenIndex([]);
const indiaTaken = takenIndex([
  {
    name: "Domestic",
    restOfWorld: false,
    regions: [{ country: "IN", provinces: null }],
  },
]);

describe("addCountry", () => {
  it("adds a free country as a whole country", () => {
    expect(addCountry([], "FR", nothingTaken)).toEqual([
      { country: "FR", provinces: null },
    ]);
  });

  it("starts with no states when another zone has the whole country", () => {
    expect(addCountry([], "IN", indiaTaken)).toEqual([
      { country: "IN", provinces: [] },
    ]);
  });

  it("keeps the existing regions and does not change the original list", () => {
    const regions: Region[] = [{ country: "US", provinces: ["CA"] }];
    const next = addCountry(regions, "FR", nothingTaken);
    expect(next).toEqual([
      { country: "US", provinces: ["CA"] },
      { country: "FR", provinces: null },
    ]);
    expect(regions).toHaveLength(1);
  });
});

describe("removeCountry", () => {
  it("removes the country whatever the case of the stored code", () => {
    const regions: Region[] = [
      { country: "in", provinces: null },
      { country: "US", provinces: null },
    ];
    expect(removeCountry(regions, "IN")).toEqual([
      { country: "US", provinces: null },
    ]);
  });

  it("leaves the list alone when the country is not there", () => {
    const regions: Region[] = [{ country: "US", provinces: null }];
    expect(removeCountry(regions, "FR")).toEqual(regions);
  });
});

describe("replaceCountryStates", () => {
  const regions: Region[] = [
    { country: "IN", provinces: null },
    { country: "US", provinces: ["CA"] },
  ];

  it("replaces the states of one country only", () => {
    expect(replaceCountryStates(regions, "IN", ["KA", "MH"])).toEqual([
      { country: "IN", provinces: ["KA", "MH"] },
      { country: "US", provinces: ["CA"] },
    ]);
  });

  it("turns a country back into the whole country with null", () => {
    expect(replaceCountryStates(regions, "US", null)[1]).toEqual({
      country: "US",
      provinces: null,
    });
  });
});

describe("toggleCountryState", () => {
  it("adds a state", () => {
    const regions: Region[] = [{ country: "US", provinces: ["CA"] }];
    expect(toggleCountryState(regions, "US", "WA", true)).toEqual([
      { country: "US", provinces: ["CA", "WA"] },
    ]);
  });

  it("starts a list when the country was a whole country", () => {
    const regions: Region[] = [{ country: "US", provinces: null }];
    expect(toggleCountryState(regions, "US", "CA", true)[0]?.provinces).toEqual(
      ["CA"],
    );
  });

  it("removes a state whichever way it was written", () => {
    const regions: Region[] = [{ country: "JP", provinces: ["JP-13", "27"] }];
    expect(
      toggleCountryState(regions, "JP", "13", false)[0]?.provinces,
    ).toEqual(["27"]);
    expect(
      toggleCountryState(regions, "JP", "jp-27", false)[0]?.provinces,
    ).toEqual(["JP-13"]);
  });
});

describe("updateRegion", () => {
  it("only changes the matching region and returns a new list", () => {
    const regions: Region[] = [
      { country: "IN", provinces: null },
      { country: "US", provinces: null },
    ];
    const next = updateRegion(regions, "US", (r) => ({ ...r, provinces: [] }));
    expect(next).toEqual([
      { country: "IN", provinces: null },
      { country: "US", provinces: [] },
    ]);
    expect(next).not.toBe(regions);
  });
});

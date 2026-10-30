import { describe, expect, it } from "vitest";
import {
  countryName,
  hasStates,
  listCountries,
  listStates,
  stateName,
} from "./geo";

describe("geo", () => {
  it("lists the countries Shopify supports", () => {
    const countries = listCountries("en");
    expect(countries.length).toBe(239);
    expect(countries.find((c) => c.code === "IN")?.name).toBe("India");
  });

  it("translates and sorts country names", () => {
    expect(countryName("IN", "fr")).toBe("Inde");
    expect(countryName("IN", "de")).toBe("Indien");
    const names = listCountries("fr").map((c) => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "fr")));
  });

  it("falls back to the code for unknown countries", () => {
    expect(countryName("zz-nope", "en")).toBe("ZZ-NOPE");
  });

  it("has Shopify's state codes", () => {
    expect(listStates("IN")).toHaveLength(37);
    expect(listStates("in").find((s) => s.code === "MH")?.name).toBe(
      "Maharashtra",
    );
    expect(listStates("JP").find((s) => s.code === "JP-13")?.name).toBe(
      "Tokyo",
    );
    expect(listStates("US")).toHaveLength(62);
  });

  it("returns no states for countries without them", () => {
    expect(listStates("FR")).toEqual([]);
    expect(hasStates("FR")).toBe(false);
    expect(hasStates("US")).toBe(true);
  });

  it("only has states for known countries", () => {
    const codes = new Set(listCountries().map((c) => c.code));
    for (const code of ["IN", "US", "JP", "KR", "PT", "GB", "AE"])
      expect(codes.has(code)).toBe(true);
  });

  it("looks up a state's name by code", () => {
    expect(stateName("IN", "MH")).toBe("Maharashtra");
    expect(stateName("in", "mh")).toBe("Maharashtra");
    expect(stateName("JP", "13")).toBe("Tokyo");
    expect(stateName("JP", "JP-13")).toBe("Tokyo");
    expect(stateName("IN", "XX")).toBe("XX");
    expect(stateName("FR", "75")).toBe("75");
  });

  it("lists states sorted by name", () => {
    const names = listStates("IN").map((s) => s.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "en")));
  });
});

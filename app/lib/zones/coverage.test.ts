import { describe, expect, it } from "vitest";
import { zoneCoverage } from "./coverage";

describe("zoneCoverage", () => {
  it("marks Rest of world", () => {
    expect(zoneCoverage({ restOfWorld: true, regions: [] }, "en")).toEqual({ kind: "restOfWorld" });
  });

  it("handles a zone with no countries", () => {
    expect(zoneCoverage({ restOfWorld: false, regions: [] }, "en")).toEqual({ kind: "none" });
  });

  it("counts states for a single country limited to states", () => {
    const zone = { restOfWorld: false, regions: [{ country: "IN", provinces: ["MH", "KA"] }] };
    expect(zoneCoverage(zone, "en")).toEqual({ kind: "states", country: "India", count: 2, total: 37 });
    expect(zoneCoverage(zone, "fr")).toMatchObject({ country: "Inde" });
  });

  it("names up to three countries", () => {
    const zone = {
      restOfWorld: false,
      regions: [
        { country: "FR", provinces: null },
        { country: "DE", provinces: null },
      ],
    };
    expect(zoneCoverage(zone, "en")).toEqual({ kind: "list", names: ["France", "Germany"] });
    expect(zoneCoverage(zone, "de")).toEqual({ kind: "list", names: ["Frankreich", "Deutschland"] });
  });

  it("names a single whole country", () => {
    const zone = { restOfWorld: false, regions: [{ country: "IN", provinces: null }] };
    expect(zoneCoverage(zone, "en")).toEqual({ kind: "list", names: ["India"] });
  });

  it("counts more than three countries", () => {
    const regions = ["FR", "DE", "IT", "ES"].map((country) => ({ country, provinces: null }));
    expect(zoneCoverage({ restOfWorld: false, regions }, "en")).toEqual({ kind: "count", count: 4 });
  });
});

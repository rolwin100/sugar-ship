import { describe, expect, it } from "vitest";
import { matchZone } from "./match-zone";
import type { Zone } from "../zones/types";

const domestic: Zone = {
  id: "domestic",
  name: "Domestic",
  restOfWorld: false,
  regions: [{ country: "IN", provinces: null }],
};
const south: Zone = {
  id: "south",
  name: "South India",
  restOfWorld: false,
  regions: [{ country: "IN", provinces: ["KA", "KL", "TN"] }],
};
const europe: Zone = {
  id: "europe",
  name: "Europe",
  restOfWorld: false,
  regions: [
    { country: "FR", provinces: null },
    { country: "DE", provinces: null },
  ],
};
const usWest: Zone = {
  id: "us-west",
  name: "US West",
  restOfWorld: false,
  regions: [{ country: "US", provinces: ["CA", "WA"] }],
};
const restOfWorld: Zone = {
  id: "row",
  name: "Rest of world",
  restOfWorld: true,
  regions: [],
};

describe("matchZone", () => {
  it("matches a whole-country zone", () => {
    expect(matchZone({ country: "IN", province: "MH" }, [domestic])?.id).toBe("domestic");
  });

  it("prefers a zone that lists the state over a whole-country zone", () => {
    const zones = [domestic, south];
    expect(matchZone({ country: "IN", province: "KA" }, zones)?.id).toBe("south");
    expect(matchZone({ country: "IN", province: "MH" }, zones)?.id).toBe("domestic");
  });

  it("falls back to Rest of world for countries no zone covers", () => {
    const zones = [domestic, europe, restOfWorld];
    expect(matchZone({ country: "JP" }, zones)?.id).toBe("row");
    expect(matchZone({ country: "DE" }, zones)?.id).toBe("europe");
  });

  it("uses Rest of world for states that no zone lists", () => {
    // US West only lists CA and WA, so a Texas address falls to Rest of world.
    const zones = [usWest, restOfWorld];
    expect(matchZone({ country: "US", province: "TX" }, zones)?.id).toBe("row");
    expect(matchZone({ country: "US", province: "CA" }, zones)?.id).toBe("us-west");
    expect(matchZone({ country: "US", province: "TX" }, [usWest])).toBeNull();
  });

  it("returns null when nothing matches", () => {
    expect(matchZone({ country: "JP" }, [domestic, europe])).toBeNull();
    expect(matchZone({ country: null }, [domestic, restOfWorld])).toBeNull();
  });

  it("ignores case and spaces in codes", () => {
    expect(matchZone({ country: " in ", province: "ka" }, [domestic, south])?.id).toBe("south");
  });

  it("breaks ties by sortOrder, then list order", () => {
    const a = { ...domestic, id: "a", sortOrder: 2 };
    const b = { ...domestic, id: "b", sortOrder: 1 };
    const c = { ...domestic, id: "c", sortOrder: 1 };
    expect(matchZone({ country: "IN" }, [a, b, c])?.id).toBe("b");
  });

  it("matches state codes with or without a country prefix", () => {
    const tokyo: Zone = {
      id: "tokyo",
      name: "Tokyo",
      restOfWorld: false,
      regions: [{ country: "JP", provinces: ["JP-13"] }],
    };
    expect(matchZone({ country: "JP", province: "13" }, [tokyo])?.id).toBe("tokyo");
    expect(matchZone({ country: "JP", province: "jp-13" }, [tokyo])?.id).toBe("tokyo");
    const plain = { ...tokyo, regions: [{ country: "JP", provinces: ["13"] }] };
    expect(matchZone({ country: "JP", province: "JP-13" }, [plain])?.id).toBe("tokyo");
    expect(matchZone({ country: "JP", province: "JP-14" }, [tokyo])).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { takenBy, takenIndex } from "./taken";

describe("takenIndex", () => {
  const index = takenIndex([
    {
      name: "Domestic",
      restOfWorld: false,
      regions: [{ country: "in", provinces: null }],
    },
    {
      name: "US West",
      restOfWorld: false,
      regions: [{ country: "US", provinces: ["CA", "wa"] }],
    },
    {
      name: "Tokyo",
      restOfWorld: false,
      regions: [{ country: "JP", provinces: ["JP-13"] }],
    },
    { name: "Rest of world", restOfWorld: true, regions: [] },
  ]);

  it("records whole countries", () => {
    expect(index.whole.get("IN")).toBe("Domestic");
    expect(index.whole.has("US")).toBe(false);
  });

  it("records states without their country prefix", () => {
    expect(index.states.get("US")?.get("WA")).toBe("US West");
    expect(index.states.get("JP")?.get("13")).toBe("Tokyo");
  });

  it("says which zone uses a country", () => {
    expect(takenBy(index, "in")).toBe("Domestic");
    expect(takenBy(index, "US")).toBe("US West");
    expect(takenBy(index, "FR")).toBeUndefined();
  });
});

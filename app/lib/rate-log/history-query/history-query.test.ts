import { describe, expect, it } from "vitest";
import { historyQueryString, readHistoryQuery } from "./history-query";

const read = (query: string) => readHistoryQuery(new URLSearchParams(query));

describe("readHistoryQuery", () => {
  it("reads filters and the page", () => {
    expect(read("outcome=fallback&mode=test&page=3")).toEqual({
      filters: { outcome: "fallback", testMode: true },
      page: 3,
    });
    expect(read("mode=live")).toEqual({
      filters: { testMode: false },
      page: 1,
    });
  });

  it("ignores values it doesn't know", () => {
    expect(read("outcome=weird&mode=x&page=-2")).toEqual({
      filters: {},
      page: 1,
    });
    expect(read("page=1.5").page).toBe(1);
  });
});

describe("historyQueryString", () => {
  it("round-trips and leaves defaults out", () => {
    const query = {
      filters: { outcome: "none" as const, testMode: false },
      page: 2,
    };
    expect(historyQueryString(query)).toBe("?outcome=none&mode=live&page=2");
    expect(read(historyQueryString(query).slice(1))).toEqual(query);
    expect(historyQueryString({ filters: {}, page: 1 })).toBe("");
  });
});

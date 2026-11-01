import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ADJUSTMENT_KIND,
  ADJUSTMENT_TYPE,
  COMBINE_STRATEGY,
  CONDITION_OPERATOR,
  CONDITION_SUBJECT,
  QUANTIFIER,
  RATE_BASIS,
  RATE_MODE,
  RULE_MATCH,
  RULE_STATUS,
} from "./constants";

const schema = readFileSync(resolve("prisma/schema.prisma"), "utf8");

/** The values of `enum <name> { ... }` in schema.prisma. */
function prismaEnum(name: string): string[] {
  const body = new RegExp(`enum ${name} \\{([^}]*)\\}`).exec(schema)?.[1];
  if (body === undefined) throw new Error(`enum ${name} not found`);
  return body
    .split("\n")
    .map((line) => line.replace(/\/\/.*/, "").trim())
    .filter(Boolean);
}

describe("constants match the Prisma enums", () => {
  const cases = [
    ["ConditionSubject", CONDITION_SUBJECT],
    ["ConditionOperator", CONDITION_OPERATOR],
    ["ProductQuantifier", QUANTIFIER],
    ["RuleStatus", RULE_STATUS],
    ["RuleMatch", RULE_MATCH],
    ["RateMode", RATE_MODE],
    ["RateBasis", RATE_BASIS],
    ["AdjustmentKind", ADJUSTMENT_KIND],
    ["AdjustmentType", ADJUSTMENT_TYPE],
    ["CombineStrategy", COMBINE_STRATEGY],
  ] as const;

  it.each(cases)("%s", (name, constant) => {
    expect(Object.values(constant).sort()).toEqual(prismaEnum(name).sort());
  });
});

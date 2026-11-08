import type { Prisma } from "@prisma/client";
import db from "../../db.server";
import type { EngineRule } from "../engine";
import {
  RATE_PRESETS,
  type RuleInput,
  type RatePreset,
  type Rule,
  type SaveRuleResult,
} from "./types";
import { toRuleCondition } from "./stored-condition";
import { toPricingColumns, toZonePricing } from "./stored-pricing";
import { validateRule } from "./validate-rule";
import { CONDITION_SUBJECT } from "../engine";
import { RATE_PRESET } from "./constants";

// Every query filters by shopId, so one shop can never read or change another shop's rules.

const withRatesAndConditions = {
  rates: {
    orderBy: { sortOrder: "asc" },
    include: { bands: { orderBy: { sortOrder: "asc" } } },
  },
  conditions: { orderBy: { sortOrder: "asc" } },
} satisfies Prisma.RuleInclude;
type RuleRow = Prisma.RuleGetPayload<{
  include: typeof withRatesAndConditions;
}>;

export async function listRules(shopId: string): Promise<Rule[]> {
  const rows = await db.rule.findMany({
    where: { shopId },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    include: withRatesAndConditions,
  });
  return rows.map(toRule);
}

export async function getRule(
  shopId: string,
  id: string,
): Promise<Rule | null> {
  const row = await db.rule.findFirst({
    where: { id, shopId },
    include: withRatesAndConditions,
  });
  return row ? toRule(row) : null;
}

/** Creates a rule when `id` is null, otherwise replaces it. Validates first. */
export async function saveRule(
  shopId: string,
  id: string | null,
  input: RuleInput,
): Promise<SaveRuleResult> {
  const zones = await db.zone.findMany({
    where: { shopId },
    select: { id: true },
  });
  const result = validateRule(input, new Set(zones.map((z) => z.id)));
  if (!result.ok) return result;
  const rule = result.rule;

  const ruleData = { name: rule.name, status: rule.status, match: rule.match };
  // One Rate row per priced zone (plus RateBand rows for a price table);
  // the checkout name and delivery estimate are shared.
  const rates = rule.prices.map((pricing, sortOrder) => {
    const { bands, ...columns } = toPricingColumns(pricing);
    return {
      zoneId: pricing.zoneId,
      sortOrder,
      ...columns,
      bands: { create: bands },
      preset: rule.preset,
      name: rule.preset ? null : rule.customName,
      description: rule.description || null,
      minDeliveryDays: rule.minDeliveryDays,
      maxDeliveryDays: rule.maxDeliveryDays,
    };
  });
  // One Condition row per condition, in the order the merchant listed them.
  // Product conditions also save their quantifier (any / all / no item).
  const conditions = rule.conditions.map((condition, sortOrder) => ({
    subject: condition.subject,
    field: condition.field,
    operator: condition.operator,
    value: condition.value,
    quantifier:
      condition.subject === CONDITION_SUBJECT.PRODUCT
        ? condition.quantifier
        : null,
    sortOrder,
  }));

  if (id === null) {
    // New rules run after existing ones.
    const last = await db.rule.findFirst({
      where: { shopId },
      orderBy: { priority: "desc" },
      select: { priority: true },
    });
    const row = await db.rule.create({
      data: {
        ...ruleData,
        shopId,
        priority: (last?.priority ?? -1) + 1,
        rates: { create: rates },
        conditions: { create: conditions },
      },
      include: withRatesAndConditions,
    });
    return { ok: true, rule: toRule(row) };
  }

  const existing = await db.rule.findFirst({
    where: { id, shopId },
    select: { id: true },
  });
  if (!existing) return { ok: false, notFound: true };

  // Replace rates (their bands go by cascade) and conditions wholesale, in one
  // transaction; simpler than diffing, and their ids aren't referenced anywhere yet.
  // Rates are created one by one because createMany can't create their bands.
  await db.$transaction(async (tx) => {
    await tx.rule.update({ where: { id }, data: ruleData });
    await tx.rate.deleteMany({ where: { ruleId: id } });
    for (const rate of rates) {
      await tx.rate.create({ data: { ...rate, ruleId: id } });
    }
    await tx.condition.deleteMany({ where: { ruleId: id } });
    await tx.condition.createMany({
      data: conditions.map((condition) => ({ ...condition, ruleId: id })),
    });
  });
  return { ok: true, rule: { id, ...rule } };
}

/** Deletes a rule and (by cascade) its rates. Returns false if it didn't exist. */
export async function deleteRule(shopId: string, id: string): Promise<boolean> {
  const { count } = await db.rule.deleteMany({ where: { id, shopId } });
  return count > 0;
}

/** Everything the engine needs to quote a checkout: all of the shop's rules, fully loaded. */
export async function loadEngineRules(shopId: string): Promise<EngineRule[]> {
  const rows = await db.rule.findMany({
    where: { shopId },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    include: {
      conditions: {
        orderBy: { sortOrder: "asc" },
        include: { postcodeList: true },
      },
      rates: {
        orderBy: { sortOrder: "asc" },
        include: {
          bands: { orderBy: { sortOrder: "asc" } },
          adjustments: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    status: row.status,
    priority: row.priority,
    match: row.match,
    exclusive: row.exclusive,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    conditions: row.conditions.map((c) => ({
      id: c.id,
      subject: c.subject,
      field: c.field,
      operator: c.operator,
      value: c.value,
      quantifier: c.quantifier,
      postcodeEntries: c.postcodeList?.entries ?? null,
    })),
    rates: row.rates.map((r) => ({
      id: r.id,
      zoneId: r.zoneId,
      preset: r.preset,
      name: r.name,
      description: r.description,
      minDeliveryDays: r.minDeliveryDays,
      maxDeliveryDays: r.maxDeliveryDays,
      mode: r.mode,
      basis: r.basis,
      price: r.price,
      stepSize: r.stepSize,
      stepPrice: r.stepPrice,
      percentBps: r.percentBps,
      bands: r.bands.map(({ from, to, price }) => ({ from, to, price })),
      adjustments: r.adjustments.map(({ kind, type, value }) => ({
        kind,
        type,
        value,
      })),
    })),
  }));
}

function toRule(row: RuleRow): Rule {
  // The checkout name and delivery estimate are the same on every rate; read the first.
  const first = row.rates[0];
  const preset =
    first?.preset && RATE_PRESETS.includes(first.preset as RatePreset)
      ? (first.preset as RatePreset)
      : null;
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    preset: first ? preset : RATE_PRESET.STANDARD,
    customName: preset ? "" : (first?.name ?? ""),
    description: first?.description ?? "",
    minDeliveryDays: first?.minDeliveryDays ?? null,
    maxDeliveryDays: first?.maxDeliveryDays ?? null,
    // Rows missing a column their mode needs are skipped (the zone shows as not priced).
    prices: row.rates.flatMap((r) => {
      const pricing = toZonePricing(r);
      return pricing ? [pricing] : [];
    }),
    match: row.match,
    // Cart and product conditions; rows that aren't valid ones (e.g. address
    // conditions from a later slice) are skipped.
    conditions: row.conditions.flatMap((c) => {
      const condition = toRuleCondition(c);
      return condition ? [condition] : [];
    }),
  };
}

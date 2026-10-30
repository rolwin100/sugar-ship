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
import { validateRule } from "./validate-rule";

// Every query filters by shopId, so one shop can never read or change another shop's rules.

const withRates = {
  rates: { orderBy: { sortOrder: "asc" } },
} satisfies Prisma.RuleInclude;
type RuleRow = Prisma.RuleGetPayload<{ include: typeof withRates }>;

export async function listRules(shopId: string): Promise<Rule[]> {
  const rows = await db.rule.findMany({
    where: { shopId },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    include: withRates,
  });
  return rows.map(toRule);
}

export async function getRule(
  shopId: string,
  id: string,
): Promise<Rule | null> {
  const row = await db.rule.findFirst({
    where: { id, shopId },
    include: withRates,
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

  const ruleData = { name: rule.name, status: rule.status };
  // One Rate row per priced zone; the checkout name and delivery estimate are shared.
  const rates = rule.prices.map(({ zoneId, price }, sortOrder) => ({
    zoneId,
    price,
    sortOrder,
    mode: "FLAT" as const,
    preset: rule.preset,
    name: rule.preset ? null : rule.customName,
    minDeliveryDays: rule.minDeliveryDays,
    maxDeliveryDays: rule.maxDeliveryDays,
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
      },
      include: withRates,
    });
    return { ok: true, rule: toRule(row) };
  }

  const existing = await db.rule.findFirst({
    where: { id, shopId },
    select: { id: true },
  });
  if (!existing) return { ok: false, notFound: true };

  // Replace the rates wholesale; simpler than diffing, and rate ids aren't referenced yet.
  await db.$transaction([
    db.rule.update({ where: { id }, data: ruleData }),
    db.rate.deleteMany({ where: { ruleId: id } }),
    db.rate.createMany({
      data: rates.map((rate) => ({ ...rate, ruleId: id })),
    }),
  ]);
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
    preset: first ? preset : "standard",
    customName: preset ? "" : (first?.name ?? ""),
    minDeliveryDays: first?.minDeliveryDays ?? null,
    maxDeliveryDays: first?.maxDeliveryDays ?? null,
    prices: row.rates.map((r) => ({ zoneId: r.zoneId, price: r.price ?? 0 })),
  };
}

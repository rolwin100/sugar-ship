import type { Prisma } from "@prisma/client";
import db from "../../db.server";
import type { Region, SaveZoneResult, Zone, ZoneListItem } from "./types";
import { validateZone, type ZoneInput } from "./validate-zone";

// Every query filters by shopId, so one shop can never read or change another shop's zones.

export async function listZones(shopId: string): Promise<ZoneListItem[]> {
  const rows = await db.zone.findMany({
    where: { shopId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { rates: true } } },
  });
  return rows.map((row) => ({ ...toZone(row), rateCount: row._count.rates }));
}

export async function getZone(shopId: string, id: string): Promise<Zone | null> {
  const row = await db.zone.findFirst({ where: { id, shopId } });
  return row ? toZone(row) : null;
}

/** Creates a zone when `id` is null, otherwise updates it. Validates against the shop's other zones first. */
export async function saveZone(
  shopId: string,
  id: string | null,
  input: ZoneInput,
): Promise<SaveZoneResult> {
  const others = (await listZones(shopId)).filter((zone) => zone.id !== id);
  const result = validateZone(input, others);
  if (!result.ok) return result;

  const data = {
    name: result.zone.name,
    restOfWorld: result.zone.restOfWorld,
    regions: result.zone.regions as unknown as Prisma.InputJsonValue,
  };

  if (id === null) {
    // New zones go to the end of the list.
    const sortOrder = others.reduce((max, zone) => Math.max(max, zone.sortOrder ?? 0), -1) + 1;
    const row = await db.zone.create({ data: { ...data, shopId, sortOrder } });
    return { ok: true, zone: toZone(row) };
  }

  const { count } = await db.zone.updateMany({ where: { id, shopId }, data });
  if (count === 0) return { ok: false, notFound: true };
  return { ok: true, zone: { id, ...result.zone } };
}

/** Deletes a zone and (by cascade) its rates. Returns false if it didn't exist. */
export async function deleteZone(shopId: string, id: string): Promise<boolean> {
  const { count } = await db.zone.deleteMany({ where: { id, shopId } });
  return count > 0;
}

function toZone(row: {
  id: string;
  name: string;
  restOfWorld: boolean;
  regions: Prisma.JsonValue;
  sortOrder: number;
}): Zone {
  return {
    id: row.id,
    name: row.name,
    restOfWorld: row.restOfWorld,
    regions: parseRegions(row.regions),
    sortOrder: row.sortOrder,
  };
}

/** The regions column is JSON, so check its shape instead of trusting it. */
function parseRegions(value: Prisma.JsonValue): Region[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const { country, provinces } = item as Record<string, unknown>;
    if (typeof country !== "string") return [];
    return [
      {
        country,
        provinces: Array.isArray(provinces)
          ? provinces.filter((p): p is string => typeof p === "string")
          : null,
      },
    ];
  });
}

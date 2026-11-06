import db from "../../db.server";
import type { ProductSnapshotInput } from "./types";

// Every query filters by shopId, so one shop can never read or change another's products.
// Ids are BigInt in the database and numbers in the app (Shopify ids are < 2^53).

/** Saves products, creating or replacing each one's row, in one transaction. */
export async function upsertProducts(
  shopId: string,
  products: ProductSnapshotInput[],
): Promise<void> {
  if (products.length === 0) return;
  await db.$transaction(
    products.map((p) => {
      const data = {
        tags: p.tags,
        productType: p.productType,
        vendor: p.vendor,
        collectionIds: p.collectionIds.map(BigInt),
      };
      return db.productSnapshot.upsert({
        where: { shopId_productId: { shopId, productId: BigInt(p.productId) } },
        create: { shopId, productId: BigInt(p.productId), ...data },
        update: data,
      });
    }),
  );
}

export async function deleteProduct(
  shopId: string,
  productId: number,
): Promise<void> {
  await db.productSnapshot.deleteMany({
    where: { shopId, productId: BigInt(productId) },
  });
}

/**
 * Makes `productIds` the products in a collection: adds the collection to them and
 * removes it from every other product. An empty list takes it off all products
 * (e.g. when the collection is deleted).
 */
export async function setCollectionMembers(
  shopId: string,
  collectionId: number,
  productIds: number[],
): Promise<void> {
  const collection = BigInt(collectionId);
  const members = new Set(productIds);
  const rows = await db.productSnapshot.findMany({
    where: {
      shopId,
      OR: [
        { collectionIds: { has: collection } },
        { productId: { in: productIds.map(BigInt) } },
      ],
    },
    select: { id: true, productId: true, collectionIds: true },
  });

  const updates = rows.flatMap((row) => {
    const inCollection = row.collectionIds.includes(collection);
    const shouldBe = members.has(Number(row.productId));
    if (inCollection === shouldBe) return [];
    const collectionIds = shouldBe
      ? [...row.collectionIds, collection]
      : row.collectionIds.filter((id) => id !== collection);
    return [
      db.productSnapshot.update({
        where: { id: row.id },
        data: { collectionIds },
      }),
    ];
  });
  if (updates.length > 0) await db.$transaction(updates);
}

/** The snapshots for these products (missing ones are left out), keyed by product id. */
export async function loadProducts(
  shopId: string,
  productIds: number[],
): Promise<Map<number, ProductSnapshotInput>> {
  if (productIds.length === 0) return new Map();
  const rows = await db.productSnapshot.findMany({
    where: { shopId, productId: { in: [...new Set(productIds)].map(BigInt) } },
  });
  return new Map(
    rows.map((row) => [
      Number(row.productId),
      {
        productId: Number(row.productId),
        tags: row.tags,
        productType: row.productType,
        vendor: row.vendor,
        collectionIds: row.collectionIds.map(Number),
      },
    ]),
  );
}

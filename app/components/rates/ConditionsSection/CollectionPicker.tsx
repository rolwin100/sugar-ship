import { useAppBridge } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";
import { gidToId } from "../../../lib/products";
import type { CollectionChoice } from "../../../lib/rules/types";

type Props = {
  number: number; // "Condition 2" in the button's label
  collections: CollectionChoice[];
  error?: string;
  onChange: (collections: CollectionChoice[]) => void;
};

/** The chosen collections by name, and a button that opens Shopify's collection picker. */
export function CollectionPicker({
  number,
  collections,
  error,
  onChange,
}: Props) {
  const { t } = useTranslation();
  const shopify = useAppBridge();

  const choose = async () => {
    const picked = await shopify.resourcePicker({
      type: "collection",
      multiple: true,
      selectionIds: collections.map((c) => ({
        id: `gid://shopify/Collection/${c.id}`,
      })),
    });
    if (!picked) return; // closed without choosing
    onChange(
      picked.flatMap((collection) => {
        const id = gidToId(collection.id, "Collection");
        return id === null ? [] : [{ id, title: collection.title }];
      }),
    );
  };

  return (
    <s-stack gap="small-200">
      <s-stack direction="inline" gap="small-200">
        {collections.length === 0 ? (
          <s-text color="subdued">{t("rates.collectionsNone")}</s-text>
        ) : (
          collections.map((c) => (
            <s-badge key={c.id}>
              {c.title || t("rates.collectionUnknown", { id: c.id })}
            </s-badge>
          ))
        )}
      </s-stack>
      <s-stack direction="inline">
        <s-button
          accessibilityLabel={t("rates.chooseCollectionsLabel", { number })}
          onClick={choose}
        >
          {t("rates.chooseCollections")}
        </s-button>
      </s-stack>
      {error && <s-text tone="critical">{error}</s-text>}
    </s-stack>
  );
}

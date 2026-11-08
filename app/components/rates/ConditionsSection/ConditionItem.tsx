import {
  removeCondition,
  replaceConditionCollections,
  replaceConditionField,
  replaceConditionOperator,
  replaceConditionQuantifier,
  replaceConditionValue,
} from "../../../lib/rules/edit-conditions";
import { ConditionRow } from "./ConditionRow";
import { ProductConditionRow } from "./ProductConditionRow";
import type { ConditionItemProps } from "../types";
import { CONDITION_SUBJECT } from "../../../lib/engine";

/**
 * One condition in the list: the right row for its kind (cart or product), with each
 * change turned into an edit of the whole list (see edit-conditions).
 */
export function ConditionItem({
  index,
  condition,
  currency,
  error,
  onConditionsChange,
}: ConditionItemProps) {
  const shared = {
    index,
    error,
    onFieldChange: (field: Parameters<typeof replaceConditionField>[2]) =>
      onConditionsChange((c) => replaceConditionField(c, index, field)),
    onValueChange: (value: string) =>
      onConditionsChange((c) => replaceConditionValue(c, index, value)),
    onRemove: () => onConditionsChange((c) => removeCondition(c, index)),
  };

  if (condition.subject === CONDITION_SUBJECT.PRODUCT) {
    return (
      <ProductConditionRow
        {...shared}
        condition={condition}
        onQuantifierChange={(quantifier) =>
          onConditionsChange((c) =>
            replaceConditionQuantifier(c, index, quantifier),
          )
        }
        onOperatorChange={(operator) =>
          onConditionsChange((c) =>
            replaceConditionOperator(c, index, operator),
          )
        }
        onCollectionsChange={(collections) =>
          onConditionsChange((c) =>
            replaceConditionCollections(c, index, collections),
          )
        }
      />
    );
  }

  return (
    <ConditionRow
      {...shared}
      condition={condition}
      currency={currency}
      onOperatorChange={(operator) =>
        onConditionsChange((c) => replaceConditionOperator(c, index, operator))
      }
    />
  );
}

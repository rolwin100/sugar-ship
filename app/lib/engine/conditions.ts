import type { EngineCart, EngineRule } from "./types";

/**
 * Does the cart satisfy the rule's conditions (using rule.match: ALL / ANY / NONE)?
 * Step 2.2 placeholder: always true. Real checks arrive in steps 2.4–2.7.
 */
export function matchesConditions(
  _rule: EngineRule,
  _cart: EngineCart,
): boolean {
  return true;
}

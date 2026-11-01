---
name: shopify-app-modularity
description: Use when building, extending or refactoring a Shopify app on React Router: file layout, types.ts, .server split, thin routes, component folders, tests and checks.
---

# Shopify app: build it modular, keep it modular

For Shopify API specifics (Admin GraphQL, Functions, extensions, app pricing, Polaris), use the shopify-plugin skills first. This skill covers how the code is organised, so every app in the agency (Sugar Rush, Sugar Ship, and future ones) stays easy to read, test and change.

## Layout

```
app/
  routes/               thin route modules only: loader, action, page, headers
  components/{feature}/ UI components, one per file, plus index.ts
  lib/{feature}/        domain logic: types.ts, constants.ts, pure .ts files, *.server.ts files, index.ts
  lib/types.ts          types shared by several features
  lib/constants.ts      constants shared by several features
  shopify.server.ts     app wiring (auth, hooks, webhooks)
  db.server.ts          Prisma client
```

## Module folders

Every pure module that has a test gets its own folder inside the feature, with an `index.ts` that re-exports it:

```
lib/rules/draft/
  draft.ts
  draft.test.ts
  index.ts            export { ... } from "./draft";
```

- The feature's `index.ts` re-exports from the folder (`export * from "./draft"`), so import paths like `../rules` do not change when a module moves into a folder.
- Other code imports the folder (`../draft`), never the file inside it. Only the folder's own test imports `./draft`.
- Files without a test stay flat. `types.ts`, `constants.ts` and `*.server.ts` files stay at the feature root.
- When a helper outgrows its file, give it its own sibling folder. Keep the barrel `index.ts` pure, with server parts in `index.server.ts`.

## Rules

1. **Routes are wiring.** A route authenticates, calls lib code, returns data, and renders components. If a route passes about 150 lines, or holds business logic or long handlers, extract them to `lib/` or `components/`.
2. **Never put helpers, types or components in `app/routes/`.** Flat routing treats every file there as a route. Folder routes (`routes/thing/route.tsx`) only pick up `route.tsx`, so a `types.ts` inside such a folder is safe.
3. **Types live in `types.ts`.** No inline `type` or `interface` in implementation files. Each feature folder has its own `types.ts`; types shared across features go in `app/lib/types.ts`. Export them from the folder's `index.ts` with `export type`. Use `import type` everywhere a type is imported.
4. **Closed string sets are constants, never repeated literals.** A fixed set of values (Prisma enums, statuses, modes, outcomes, preset names) is declared once as an `as const` object in the feature's `constants.ts`, for example `export const RATE_MODE = { FLAT: "FLAT", BANDS: "BANDS" } as const;`. Derive the type from it: `type RateMode = (typeof RATE_MODE)[keyof typeof RATE_MODE]`. In code, write `RATE_MODE.FLAT`, not `"FLAT"`. Do not use the TS `enum` keyword. Where a UI needs a display order, build an ordered array from the constants (`[RATE_MODE.FLAT, RATE_MODE.BANDS] as const`). Constants that mirror a Prisma enum get a test that reads `prisma/schema.prisma` and fails on drift. Plain strings stay for one-off values, locale keys and test fixtures.
5. **Keep server code apart from pure code.** Anything that touches Prisma, the Shopify Admin API or secrets goes in a `*.server.ts` file. Pure logic (matching, validation, pricing, mapping) lives in plain `.ts` files that import nothing from the database or Shopify, so its tests need no database. Barrels follow the same split: `index.ts` exports pure parts only, `index.server.ts` exports the server parts.
6. **One component per file.** The file name is the component name in PascalCase, and an `index.ts` re-exports the folder. Components take explicit props, and do not fetch data or import from `.server` modules (types come from `types.ts`). Shared stateful logic goes into a `useSomething` hook.
7. **Pure functions return new data.** Never mutate the arguments. Name them with verbs that say so: `add`, `remove`, `replace`, `toggle`, `update`. Avoid `set*` unless it really sets React state.
8. **Every database query is scoped to the shop.** Filter by `shopId`, and look the shop up with a helper such as `requireShop(session.shop)`, so one shop can never read or change another's data.
9. **Be explicit about units.** Store money as integer subunits, weight in grams, percentages in basis points, and say so in field names or comments.
10. **Validate JSON columns at the boundary.** Parse stored JSON into a checked shape (for example `parseRegions`) instead of trusting it.
11. **Webhook handlers are idempotent.** Shopify can resend them, so running one twice must be safe.
12. **User-visible text goes through i18n keys.** Add the key for every supported locale in the same change.

## Building a feature

1. Prisma model and migration.
2. `lib/{feature}/types.ts` and `constants.ts` (with a drift test for any Prisma enum mirror).
3. Pure logic in module folders, each with a colocated `*.test.ts` (vitest) and an `index.ts`.
4. A shop-scoped `*.server.ts` store that reads and writes the database.
5. Components in `components/{feature}/`.
6. Route wiring: loader, action, page.
7. i18n keys.
8. Run the checks below.

## Refactoring workflow

- **Plan first.** List the steps and settle open decisions with the user before editing. Then do one step at a time.
- **Preserve behavior.** Move code with scripted edits that keep the logic text unchanged, then fix imports, delete the old files, and grep for stale imports. For an endpoint that handles real traffic (like a carrier-rates callback), capture its output for a set of sample requests before the change and diff it afterwards.
- **Stay in scope.** Do not reformat or rewrite files the step does not need to touch.
- **Do not touch git unless asked.** No commits, branch changes or lock-file cleanup on your own.

## Checks after every step

- `npm run typecheck` (or `tsc --noEmit` when the route type generator cannot run)
- `npm run lint` (oxlint)
- `npm run format:check` (oxfmt), or `oxfmt --check` on the files you touched
- `npm test` (vitest)

The tooling is oxlint and oxfmt, not ESLint or Prettier. Config lives in `.oxlintrc.json` and `.oxfmtrc.json`.

## Smells to fix when you see them

- A route file that defines types, helpers or several components.
- A component importing from a `.server` module.
- A pure function that needs a database to be tested.
- A tested module sitting loose at the feature root instead of in its own folder with an `index.ts`.
- A string literal like `"FLAT"` or `"ACTIVE"` that belongs to a closed set (use the constant).
- The same JSX block repeated in two places (extract a component).
- A `set*` or `get*` name on a function that does something else.

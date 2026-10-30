# Shopify app development

This app is scaffolded from a Shopify app template. See the README for framework-specific details.

Use the [Shopify AI Toolkit](https://shopify.dev/docs/apps/build/ai-toolkit) for all Shopify API and platform work. If missing, install it in the agent host per that page (or `npx skills add Shopify/shopify-ai-toolkit --list` for skill-compatible hosts) — do not add tooling to this repo.

## Code structure

For every code change in this app (new feature, refactor, route, component, or lib module), follow the `shopify-app-modularity` skill in `.claude/skills/shopify-app-modularity/SKILL.md`. In short:

- Keep routes thin: loader, action, page and headers only. Never put helpers, types or components in `app/routes/`.
- Put types in `types.ts`, not inline in implementation files.
- Keep Prisma and Shopify Admin API code in `*.server.ts` files, apart from pure logic that can be tested without a database.
- Put UI in `app/components/{feature}/`, one component per file, and domain logic in `app/lib/{feature}/`.
- Scope every database query to the shop.
- After each change, run the typecheck, oxlint, oxfmt and vitest.

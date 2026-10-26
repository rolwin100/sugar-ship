# Production image for the Sugar Ship app server (admin UI, webhooks, rate endpoint).

FROM node:22-alpine AS base
# Set to the version `pnpm -v` prints on your machine, so the lockfile matches.
ARG PNPM_VERSION=10.33.0
RUN apk add --no-cache openssl \
  && corepack enable \
  && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /app

# Workspace manifests only, so dependency layers are cached between code changes.
FROM base AS manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma

# All dependencies, then build the server.
FROM manifests AS build
RUN pnpm install --frozen-lockfile --filter sugar-ship
COPY . .
RUN pnpm prisma generate && pnpm build

# Production dependencies only, with the Prisma client generated.
FROM manifests AS deps
RUN pnpm install --frozen-lockfile --prod --filter sugar-ship \
  && pnpm prisma generate

FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY package.json ./
COPY prisma ./prisma
RUN chown -R node:node /app
USER node
EXPOSE 3000
# Applies pending migrations, then starts the server.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node_modules/.bin/react-router-serve ./build/server/index.js"]

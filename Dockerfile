FROM node:24-bookworm-slim@sha256:24dc26ef1e3c3690f27ebc4136c9c186c3133b25563ae4d7f0692e4d1fe5db0e AS build

WORKDIR /app

COPY package.json pnpm-lock.yaml tsconfig.json ./
COPY scripts/prepare.js ./scripts/prepare.js
COPY src ./src

RUN corepack enable && pnpm install --frozen-lockfile
RUN pnpm build
RUN pnpm prune --prod

FROM node:24-bookworm-slim@sha256:24dc26ef1e3c3690f27ebc4136c9c186c3133b25563ae4d7f0692e4d1fe5db0e

LABEL org.opencontainers.image.title="RepoRacer"
LABEL org.opencontainers.image.description="Benchmark AI coding agents on your own repository using real tasks mined from git history."
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.licenses="MIT"

ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules

USER node
ENTRYPOINT ["node", "/app/dist/cli.js"]
CMD ["--help"]

# BUILDER

FROM node:24.22.1-alpine AS app-builder

WORKDIR /var/scripts/token-supply

# package-lock.json is the source of truth: `npm ci` fails if it and
# package.json disagree, and --ignore-scripts keeps dependency install scripts
# from running. typescript is a production dependency, so --omit=dev still
# leaves the compiler available for the build.
COPY package.json package-lock.json tsconfig.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY src ./src
RUN npm run build

# PRODUCTION

FROM node:24.22.1-alpine AS app
LABEL org.opencontainers.image.vendor='Dacoco GMBH' \
      org.opencontainers.image.description='Token Supply API'

ENV NODE_ENV=production
WORKDIR /var/scripts/token-supply

COPY --chown=node:node --from=app-builder /var/scripts/token-supply/package.json ./package.json
COPY --chown=node:node --from=app-builder /var/scripts/token-supply/node_modules ./node_modules
COPY --chown=node:node --from=app-builder /var/scripts/token-supply/dist ./dist

USER node

# Listens on $SERVER_PORT. Needs ETH_ENDPOINT, ETH_TOKEN_CONTRACT, BSC_ENDPOINT,
# BSC_TOKEN_CONTRACT and WAX_ENDPOINT from the environment.
CMD [ "node", "dist/index.js" ]

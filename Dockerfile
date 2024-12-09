# BUILDER

FROM node:18-alpine AS app-builder
RUN apk add --no-cache --virtual build-dependencies curl git

COPY --chown=node . /var/scripts/token-supply

USER node
WORKDIR /var/scripts/token-supply

RUN npm install --omit=dev
RUN npm run build

# PRODUCTION

FROM node:18-alpine AS app
LABEL org.opencontainers.image.vendor='Dacoco GMBH' \
      org.opencontainers.image.description='Token Supply API'

COPY --chown=node --from=app-builder /var/scripts/token-supply /var/scripts/token-supply
USER node
WORKDIR /var/scripts/token-supply

CMD [ "node", "--version" ]
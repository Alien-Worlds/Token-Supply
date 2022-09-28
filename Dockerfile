FROM node:17-alpine3.12

ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV

RUN mkdir -p /usr

WORKDIR /usr

COPY src src
COPY scripts scripts
COPY package.json tsconfig.json yarn.lock /usr/

RUN yarn
RUN yarn build
ENTRYPOINT [ "node" "dist/landholder-runner-daemon.js" ]

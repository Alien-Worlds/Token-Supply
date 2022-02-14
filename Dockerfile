FROM node:17

WORKDIR /usr

COPY ./package*.json .
COPY ./src ./src
COPY ./tsconfig.json .

RUN yarn
RUN yarn build


CMD [ "node", "dist/landholder-runner-daemon.js" ]
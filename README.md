# Token Supply API

Small Express service that reports the TLM token supply. It reads the total
supply from the WAX chain, then subtracts the balances held by a fixed list of
excluded accounts on WAX, Ethereum and BSC (`src/excludedAccounts.ts`) to get
the circulating supply.

## API

`GET /token`

| Query param | Values | Default |
| --- | --- | --- |
| `type` | `supply`, `circulating`, `detailed` | `circulating` |
| `localised` | a locale such as `en-US` or `de-DE` | unset |

| Request | Response |
| --- | --- |
| `?type=supply` | total supply as a number |
| `?type=circulating` | supply minus excluded balances, as a number |
| `?type=detailed` | `{ total_supply, exclusions: { wax, eth, bsc }, supply_after_exclusions }` |
| any of the above with `localised=en-US` | a string with four decimals, e.g. `"1,000,000.0000 TLM"` |
| unknown `type` | `200` with the string `"Invalid type"` |
| a data source fails or config is missing | `500` with `{"error":"Failed to fetch token supply"}` |

The 500 body is deliberately generic, because RPC errors can contain endpoint
URLs with API keys. The detail is written to the server log.

There is no authentication, TLS or dedicated health endpoint. Put the service
behind something that provides TLS, and use `GET /token?type=supply` as a
liveness check.

## Configuration

All settings are environment variables. Locally they are read from `.env`
(git-ignored). In a deployed environment, set them on the container.

| Variable | Purpose |
| --- | --- |
| `WAX_ENDPOINT` | WAX chain API base URL (the service appends `/v1/chain/...`) |
| `ETH_ENDPOINT` | Ethereum JSON-RPC URL |
| `ETH_TOKEN_CONTRACT` | TLM token contract address on Ethereum |
| `BSC_ENDPOINT` | BSC JSON-RPC URL |
| `BSC_TOKEN_CONTRACT` | TLM token contract address on BSC |
| `SERVER_PORT` | Port the server listens on |

Requests fail with a 500 if a WAX, ETH or BSC value is empty. The RPC
endpoints may contain API keys, so treat them as secrets and do not commit them.

## Run locally

Requires Node.js 24.22.1 or newer (see `.nvmrc`).

Create a `.env` file containing the variables above, then:

```sh
npm ci
npm run api
curl "localhost:$SERVER_PORT/token?type=supply"
```

`npm run api` runs `src/index.ts` through `ts-node` and is for development.
The Docker image runs the compiled output instead (`node dist/index.js`).

## Deploy with Docker

The `Dockerfile` is multi-stage. The builder stage runs `npm ci --omit=dev
--ignore-scripts` and `npm run build`. The final stage is
`node:24.22.1-alpine` with only `node_modules` and `dist/`, `NODE_ENV=production`,
running as the unprivileged `node` user. Its default command is
`node dist/index.js`, so no command is needed.

```sh
docker build -t token-supply .

docker run -d --name token-supply \
  --restart on-failure \
  --env-file .env \
  -p 3000:3000 \
  token-supply
```

The container listens on `SERVER_PORT`, so the right-hand side of `-p` must
match it. In the example above that is `3000`.

### docker compose

```sh
docker compose up -d --build
```

`docker-compose.yml` builds the image, passes the six variables above through
from your shell or `.env`, and restarts on failure.

| Variable | Effect | Default |
| --- | --- | --- |
| `SERVER_PORT` | port the app listens on inside the container | `3000` |
| `HOST_PORT` | port published on the host | `3000` |

For example, `HOST_PORT=3090 docker compose up -d --build` serves the API on
`localhost:3090` while the container still listens on `SERVER_PORT`.

### Deployment checklist

- The image uses `node:24.22.1-alpine`. If you change the Node version, update
  `.nvmrc`, `engines.node` in `package.json` and both `FROM` lines together.
- Rebuild the image when Node publishes security releases. Check
  <https://nodejs.org/en/blog/vulnerability> for patched versions.
- The container needs outbound HTTPS access to the WAX, ETH and BSC endpoints.
- Run it behind a reverse proxy or load balancer that provides TLS and any
  access control.
- Watch the container logs. Failed requests log `Failed to fetch token supply:`
  followed by the underlying error.
- If the process exits, the restart policy brings it back. A single failed
  request does not exit the process.

This repository has no AWS Lambda, serverless or other cloud configuration.
If the service runs somewhere else, such as Lambda, document that deployment
here once it is confirmed.

## Develop

```sh
npm test                 # run the vitest suite
npm run test:coverage    # run the suite with a coverage report
npm run build            # type-check and compile to dist/
```

The tests use fake services and mock `node-fetch` and `ethers`, so they do not
need network access or a `.env` file.

`src/app.ts` exports the Express app, and `src/index.ts` only loads `.env` and
starts listening. Import `app` in tests rather than `index`.

## CI

`.github/workflows/test.yml` runs on every push and pull request to `main` or
`master`, with the Node version from `.nvmrc`. It has two jobs:

- **test**: `npm ci --ignore-scripts`, `npm run build`, `npm run test:coverage`,
  then a non-blocking `npm audit --omit=dev` that only reports.
- **image**: builds the Docker image, starts it with unreachable upstream
  endpoints, and checks that `GET /token` returns the handled `500` and the
  container stays up. This proves the image boots and serves. It does not prove
  the real WAX, ETH or BSC endpoints work.

The image is built in CI but not published.

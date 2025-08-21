
FROM node:24.6.0-alpine AS node-builder

WORKDIR /backend

RUN apk update && \
    apk add git

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src/ ./src/

# Build the TypeScript code
RUN npx tsc

FROM registry.heroiclabs.com/heroiclabs/nakama:3.22.0

COPY --from=node-builder /backend/build/*.js /nakama/data/modules/build/
COPY local.yml /nakama/data/
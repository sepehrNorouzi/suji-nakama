
FROM node:24.6.0-alpine AS node-builder

WORKDIR /backend

RUN apk update && \
    apk add git

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM registry.heroiclabs.com/heroiclabs/nakama:3.22.0

COPY --from=node-builder /backend/modules/*.js /nakama/data/modules/
COPY local.yml /nakama/data/

# Build Angular SPA
FROM node:22-bookworm AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
COPY angular.json tsconfig.json tsconfig.app.json tsconfig.spec.json ./
COPY public ./public
COPY src ./src
RUN npm ci --ignore-scripts
RUN npx ng build --configuration=production

# Server runtime (API + static)
FROM node:22-bookworm AS runtime
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY server/package.json server/package-lock.json* ./server/
WORKDIR /app/server
RUN npm install

COPY server ./
COPY --from=frontend /app/dist /app/dist

ENV NODE_ENV=production
ENV PORT=4318
ENV HOST=0.0.0.0
ENV DATA_DIR=/data
ENV STATIC_DIR=/app/dist/household-budget/browser

VOLUME ["/data"]
EXPOSE 4318

CMD ["npx", "tsx", "src/index.ts"]

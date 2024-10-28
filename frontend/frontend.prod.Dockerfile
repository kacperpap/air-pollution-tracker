FROM node:23-alpine AS builder

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

RUN mkdir -p /app/node_modules && chown -R appuser:appgroup /app

USER appuser

COPY --chown=appuser:appgroup package*.json ./
COPY --chown=appuser:appgroup tsconfig.json ./
COPY --chown=appuser:appgroup tailwind.config.js ./

RUN npm ci

COPY --chown=appuser:appgroup . .

RUN npm run build

FROM node:23-alpine

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=builder /app/build .
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

USER appuser

RUN npm ci --production

RUN npm install -g serve

CMD ["serve", "-s", ".", "-l", "3000"]

EXPOSE 3000

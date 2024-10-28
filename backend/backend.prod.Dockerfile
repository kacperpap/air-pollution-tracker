FROM node:23-alpine AS base

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app


FROM base AS dependencies

RUN mkdir -p /app/node_modules && chown -R appuser:appgroup /app

USER appuser

COPY --chown=appuser:appgroup package*.json ./

RUN npm ci


FROM base AS builder

WORKDIR /app

RUN mkdir -p /app/dist && chown -R appuser:appgroup /app/dist

USER appuser

COPY --from=dependencies /app/node_modules ./node_modules
COPY --chown=appuser:appgroup . .

RUN npx prisma generate

RUN npm run build


FROM node:23-alpine AS production

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app
USER appuser

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

RUN npx prisma generate

EXPOSE 9000

CMD ["npm", "run", "start:prod"]

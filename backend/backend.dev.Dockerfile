FROM node:20-alpine AS base

# https://www.prisma.io/docs/orm/prisma-client/deployment/serverless/deploy-to-aws-lambda#general-considerations-when-deploying-to-aws-lambda
# https://www.prisma.io/docs/orm/reference/environment-variables-reference#cli-binary-targets

RUN apk add --no-cache openssl postgresql-client

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app


FROM base AS dependencies

RUN mkdir -p /app/node_modules && chown -R appuser:appgroup /app

USER appuser

COPY --chown=appuser:appgroup ./backend/package*.json ./

RUN npm ci


FROM base AS builder

WORKDIR /app

RUN mkdir -p /app/dist && chown -R appuser:appgroup /app /app/dist

USER appuser

COPY --from=dependencies /app/node_modules ./node_modules
COPY --chown=appuser:appgroup ./backend/ .

RUN npx prisma generate

RUN npm run build


FROM base AS production

WORKDIR /app
USER appuser

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 9000

CMD ["npm", "run", "start:prod"]







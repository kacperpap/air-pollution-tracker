FROM node:20-alpine AS builder

WORKDIR /app

COPY --chown=appuser:appgroup . .

RUN npm ci

RUN npm run build

FROM node:20-alpine

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=builder /app/build .

RUN npm install -g serve

USER appuser

EXPOSE 3000

# -s / --single : tryb SPA (Single Page Application), który automatycznie przekierowuje wszystkie zapytania do index.html

CMD ["serve", "-s", ".", "-l", "3000"]


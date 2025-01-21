FROM node:20-alpine AS builder

WORKDIR /app

COPY --chown=appuser:appgroup ./frontend/ .

RUN npm ci

RUN npm run build

FROM node:20-alpine

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=builder /app/build .

COPY ./frontend/env.sh .

RUN chown -R appuser:appgroup /app

RUN npm install -g serve

RUN chmod +x env.sh

USER appuser

EXPOSE 3000

# -s / --single : tryb SPA (Single Page Application), który automatycznie przekierowuje wszystkie zapytania do index.html
# env.sh pozwala na dynamiczą zmianę zmiennych środowiskowych bez przebudowywania obrazu (np. ustawienie domeny dla zapytań)

CMD ["/bin/sh", "-c", "./env.sh && serve -s . -l 3000"]


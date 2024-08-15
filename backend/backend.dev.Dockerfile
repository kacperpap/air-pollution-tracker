FROM node:22.5.1-bullseye-slim AS base

WORKDIR /usr/src/app

COPY package*.json .

FROM base AS development

RUN --mount=type=cache,target=/usr/src/app/.npm \
    npm set cache /usr/src/app/.npm && \
    npm install

COPY . .

RUN npx prisma generate

EXPOSE 9000

CMD ["npm", "run", "start:dev"]


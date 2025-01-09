FROM cypress/included:13.6.1

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./

RUN npm install

COPY cypress.config.js .
COPY cypress/ ./cypress/


CMD ["npx", "cypress", "run", "--config-file", "cypress.config.js", "--headed"]


FROM cypress/included:13.6.1

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./

RUN npm install

RUN apt-get update && apt-get install -y awscli

COPY cypress.config.js .
COPY cypress/ ./cypress/

CMD ["npm", "run", "test:e2e", "--", "--headed"]

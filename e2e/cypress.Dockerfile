# Run containers only with app started via helm chart
# This creates a single domain for both frontend and backedn, so that
# it can use smae site requests, (running via docker compose makes separate containers in docker seen as frontend and backedn domain)
# which requires to set a secure (https) connection to perform cross site resource sharing as cookies (access-token)

# apt.local must be a localhost ip adress of your docker machine (check ipconfig for vethernet)
# docker run -e CYPRESS_FRONTEND_URL=https://apt.local -e API_BASE_URL=https://apt.local --add-host=apt.local:192.168.80.1 cypress-test

FROM cypress/included:13.6.1

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./

RUN npm install

COPY cypress.config.js .
COPY cypress/ ./cypress/


CMD ["npm", "run", "test:e2e", "--", "--headed"]




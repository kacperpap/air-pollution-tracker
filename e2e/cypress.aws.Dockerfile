FROM cypress/included:13.6.1

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./

RUN npm install

RUN apt-get update && \
    apt-get install -y curl unzip && \
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install

COPY cypress.config.js .
COPY cypress/ ./cypress/

CMD ["npm", "run", "test:e2e", "--", "--headed"]

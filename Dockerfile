FROM node:16.20.0

WORKDIR /usr/src/app

COPY package.json ./

# Generate package-lock.json
RUN npm install --package-lock-only

# Install dependencies
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["node", "src/server.js"]
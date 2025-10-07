FROM node:20.18-bullseye

WORKDIR /app

COPY package.json ./
COPY tsconfig.json ./

RUN npm install --no-audit --no-fund

COPY . .

RUN npm run build

EXPOSE 4000

CMD ["node", "dist/server.js"]


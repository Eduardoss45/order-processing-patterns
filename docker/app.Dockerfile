FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY packages ./packages
COPY projects ./projects
COPY tsconfig.json ./

RUN npm install

CMD ["npm", "run", "dev:stream"]

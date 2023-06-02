# Dockerfile
FROM node:18.16

WORKDIR /app

COPY package*.json ./
COPY .env ./


RUN npm install

COPY . .

EXPOSE 8080

CMD [ "npm", "run", "start" ]
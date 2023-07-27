# Dockerfile
FROM node:18.16
RUN npm install -g pnpm

WORKDIR /app
COPY . .
RUN pnpm install

EXPOSE 8080

CMD [ "pnpm", "start-server" ]
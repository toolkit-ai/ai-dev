# Dockerfile
FROM node:18.16

WORKDIR /app
COPY . .
RUN pnpm install

EXPOSE 8080

CMD [ "pnpm", "start-agent-server" ]
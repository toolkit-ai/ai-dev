# Dockerfile
FROM node:18.16
RUN npm install -g pnpm

WORKDIR /app

# HACK! This is a workaround for using local packages in development.
# I'll update this shortly to have separate development and production Dockerfiles.
RUN mkdir core
WORKDIR /app/core
COPY core .

WORKDIR /app/local
COPY local .
RUN pnpm install

EXPOSE 8080

CMD [ "pnpm", "start-agent" ]
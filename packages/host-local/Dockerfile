# Dockerfile
FROM node:18.16
RUN npm install -g pnpm

WORKDIR /app

# HACK! This is a workaround for using local packages in development.
# I'll update this shortly to have separate development and production Dockerfiles.
RUN mkdir agent
WORKDIR /app/agent
COPY core .

RUN mkdir host-core
WORKDIR /app/host-core
COPY host-core .
# END HACK!

WORKDIR /app/host-local
COPY host-local .
RUN pnpm install

EXPOSE 8080

CMD [ "pnpm", "start" ]
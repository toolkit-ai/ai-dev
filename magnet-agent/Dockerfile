# Dockerfile
FROM node:18.16

WORKDIR /app
COPY . .
RUN npm install

EXPOSE 8080

CMD [ "npm", "magnet-agent-server" ]
# Dockerfile
FROM node:18.16

WORKDIR /app

COPY package*.json ./

RUN npm install
RUN npm install -g form-data

COPY . .

EXPOSE 3000

CMD [ "npm", "run", "start" ]


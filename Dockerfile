FROM node:22-slim

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3100
CMD ["npm", "start"]

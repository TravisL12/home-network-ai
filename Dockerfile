FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN mkdir -p /app/documents /app/images /app/pictures

EXPOSE 3000

CMD ["npm", "start"]
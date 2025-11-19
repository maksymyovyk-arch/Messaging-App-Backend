FROM node:21

COPY package.json .

RUN npm i

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
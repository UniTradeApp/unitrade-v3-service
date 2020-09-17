FROM node:12

WORKDIR /usr/unitrade-service

COPY package.json .
COPY yarn.lock .

RUN yarn

COPY . .

RUN yarn build

ENV DEBUG="unitrade-service*"

CMD ["yarn", "main"]
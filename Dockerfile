FROM node:12-alpine

WORKDIR /usr/unitrade-service

RUN apk update && \
    apk upgrade && \
    apk add git

COPY package.json .
COPY yarn.lock .

RUN yarn

COPY . .

RUN yarn build:fresh

ENV DEBUG="unitrade-service*"

CMD ["yarn", "main"]
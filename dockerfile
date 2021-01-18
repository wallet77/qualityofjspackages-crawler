FROM node:14-alpine
RUN apk update && apk upgrade && apk --no-cache add git

WORKDIR /home/node/app

RUN chmod -R 777 /home/node/app

COPY package*.json ./

RUN npm install --production --prefix /home/node/app && npm cache clean --force

RUN git --version && npm -v && node -v

COPY . .

USER root

CMD [ "node", "index.js" ]

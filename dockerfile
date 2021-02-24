# -------------------------------------------
#                RUNTIME
# -------------------------------------------
FROM node:14-alpine
RUN apk update && apk upgrade && apk --no-cache add git dumb-init

ENV NODE_ENV production

WORKDIR /home/node/app

RUN rm -rf /home/node/app/repos && mkdir /home/node/app/repos

COPY . /home/node/app

RUN chown -R node:node /home/node/app

RUN npm install --production --prefix /home/node/app && npm cache clean --force

RUN git --version && npm -v && node -v

RUN cp /home/node/app/resources/scaphandre /usr/local/bin/scaphandre
RUN chmod 775 /usr/local/bin/scaphandre
RUN chmod a+s /usr/local/bin/scaphandre
ENV SCAPHANDRE_BIN /usr/local/bin/scaphandre

USER root

CMD [ "dumb-init", "node", "index.js" ]

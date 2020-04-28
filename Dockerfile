FROM node:14.0.0

ENV ROOT_PATH /app
RUN mkdir $ROOT_PATH
WORKDIR $ROOT_PATH
ADD package.json $ROOT_PATH/

RUN npm install

ADD . .

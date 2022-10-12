FROM node:16 AS build-client

COPY ./client /client
WORKDIR /client
RUN yarn install && yarn run build

FROM node:16 AS build-pos
COPY ./PoS/frontend /pos-frontend
WORKDIR /pos-frontend
RUN yarn install && yarn run build


FROM node:16
COPY ./PoS/server /app
WORKDIR /app
RUN yarn install
RUN apt-get update && apt-get install imagemagick graphicsmagick

COPY --from=build-client /client/build /app/build
COPY --from=build-pos /pos-frontend/build /app/pos-build

RUN ./node_modules/typescript/bin/tsc

EXPOSE 8999
CMD [ "node", "index.js" ]

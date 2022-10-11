FROM node:16

COPY ./client /client
WORKDIR /client
RUN npm install && npm run build

COPY ./PoS/frontend /pos-frontend
WORKDIR /pos-frontend
RUN npm install && npm run build


COPY ./PoS/server /app
WORKDIR /app
RUN npm install

RUN cp -r /client/build .
RUN cp -r /pos-frontend/build pos-build

RUN ./node_modules/typescript/bin/tsc

EXPOSE 8999
CMD [ "node", "index.js" ]

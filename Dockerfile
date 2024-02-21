FROM node:18-bullseye-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends libsqlite3-dev python3 build-essential openssl

RUN mkdir /app

WORKDIR /app

COPY . /app

RUN openssl req -new -newkey rsa:4096 -days 3650 -nodes -x509 \
    -subj "/C=US/ST=NC/L=Local/O=Dev/CN=localhost" \
    -keyout ./build/ssl.key\
    -out ./build/ssl.crt

RUN npm install
RUN npm run build

EXPOSE 80
EXPOSE 443

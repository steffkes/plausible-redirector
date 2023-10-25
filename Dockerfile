FROM node:20.8.1-alpine3.17

WORKDIR /app
ADD ./ ./

RUN npm install --omit dev

CMD ["node", "app.mjs"]

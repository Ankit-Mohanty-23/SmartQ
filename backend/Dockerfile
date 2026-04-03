FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat netcat-openbsd

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

RUN chmod +x entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["./entrypoint.sh"]

CMD ["npm", "run", "dev"]

FROM node:18-alpine
WORKDIR /api
COPY . .
RUN yarn install
RUN npx prisma generate
RUN yarn build
EXPOSE 8080
CMD ["yarn","start"]

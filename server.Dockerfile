FROM node:16.9.0-alpine as serverbuild
WORKDIR /app
ADD server /app/server
ADD common /app/common
RUN yarn --cwd ./server
RUN yarn --cwd ./server build
RUN npm prune --prefix ./server --production

FROM node:16.9.0-alpine as serverrun
WORKDIR /app
COPY --from=serverbuild /app/server/node_modules ./server/node_modules
COPY --from=serverbuild /app/server/dist ./server/dist
COPY --from=serverbuild /app/server/.env.production ./server
COPY --from=serverbuild /app/server/package.json ./server
ENV NODE_ENV=production
ENV NODE_PATH=./server/dist
ENV TZ=Asia/Ho_Chi_Minh
RUN set -x \
  && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime \
  && echo $TZ > /etc/timezone
EXPOSE 80
CMD [ "yarn", "--cwd", "./server", "start" ]

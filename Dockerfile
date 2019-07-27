ADD package.json /app
ADD index.js /app

RUN cd /app; npm install

ENV NODE_ENV production
ENV PORT 8082
EXPOSE 8082

WORKDIR "/app"
CMD [ "npm", "start" ]

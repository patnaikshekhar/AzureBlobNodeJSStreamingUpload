FROM node

WORKDIR /app
EXPOSE 8080

COPY . /app
RUN npm install

CMD ["npm", "start"]
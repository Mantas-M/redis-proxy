FROM node:18
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
RUN npm install
COPY src/ ./src/
EXPOSE 6381
CMD [ "npm", "run", "start" ]

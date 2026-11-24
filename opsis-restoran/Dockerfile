FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY tsconfig.json ./
COPY src ./src
COPY migrations ./migrations
COPY public ./public
ENV NODE_ENV=production
EXPOSE 3000
USER node
CMD ["npx", "tsx", "src/index.ts"]

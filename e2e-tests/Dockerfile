FROM mcr.microsoft.com/playwright:v1.48.0-jammy

WORKDIR /app
COPY package.json ./
RUN npm install
COPY playwright.config.ts ./
COPY tests ./tests

ENTRYPOINT ["npx", "playwright", "test"]

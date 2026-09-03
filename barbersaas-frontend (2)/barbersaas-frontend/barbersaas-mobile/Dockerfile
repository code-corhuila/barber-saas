# Build estatico del target web (Expo Router / React Native Web), servido por Nginx.
# Pensado para pruebas automatizadas de navegador (Selenium, etc.) y para ver la app
# sin depender del Metro bundler.

# Etapa de build
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* .npmrc* ./
RUN npm install

COPY . .

ARG EXPO_PUBLIC_API_URL=http://localhost:8080
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL
ENV CI=1

RUN npx expo export -p web

# Etapa de servido
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

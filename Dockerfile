# Step 1: Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Speed up installations by copying packages manifests first
COPY package*.json ./
RUN npm ci

# Copy codebase and compile React assets
COPY . .
RUN npm run build

# Step 2: Runtime serving stage (production-optimized)
FROM nginx:alpine

# Copy built static files to Nginx's public folder
COPY --from=build /app/dist /usr/share/nginx/html

# Inject our dynamic Nginx configuration template.
# The standard nginx docker image automatically performs environment variable
# substitution on files in this directory before starting Nginx.
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Provide an explicit default PORT for local debugging (will be overridden by GCP Cloud Run)
ENV PORT=8080

EXPOSE 8080

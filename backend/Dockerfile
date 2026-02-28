FROM node:20-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 5000

# Start server (run migrations and postgis setup prior to starting)
CMD npx prisma migrate deploy && node prisma/run-postgis-setup.js && npm start

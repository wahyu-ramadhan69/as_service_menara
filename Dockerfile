# Gunakan base image Node.js versi 20
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Salin file package.json dan package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Salin seluruh project ke dalam container
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build project Next.js
RUN npm run build

# Expose port untuk aplikasi
EXPOSE 3000

# Jalankan aplikasi
CMD ["npm", "start"]

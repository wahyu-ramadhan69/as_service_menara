# Gunakan base image Alpine minimal
FROM alpine:3.18

# Install dependensi runtime untuk Node.js binary
RUN apk add --no-cache libstdc++ libgcc

# Salin file binary dari host (pastikan Anda copy terlebih dahulu)
COPY node /usr/bin/node
COPY npm /usr/bin/npm

# Berikan permission executable
RUN chmod +x /usr/bin/node /usr/bin/npm

# Tambahkan symlink agar command "node" dan "npm" dikenali di PATH
RUN ln -sf /usr/bin/node /usr/local/bin/node && \
    ln -sf /usr/bin/npm /usr/local/bin/npm

# Set direktori kerja
WORKDIR /app

# Salin file package.json dan package-lock.json
COPY package*.json ./

# Install dependencies (pastikan punya folder node_modules jika offline)
RUN npm install

# Salin semua isi project
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Buka port 3000
EXPOSE 3000

# Jalankan aplikasi
CMD ["npm", "start"]

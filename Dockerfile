# Gunakan image resmi Node.js versi 20 (bukan slim)
FROM node:20

# Buat direktori kerja di dalam container
WORKDIR /app

# Salin semua file proyek ke dalam container
COPY . .

# Salin node_modules dari host (pastikan sudah lengkap)
COPY ./node_modules ./node_modules

# Salin file .env ke dalam container
COPY .env .env

# Nonaktifkan telemetry Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# (Opsional) Jalankan build jika belum dilakukan di luar
# RUN npm run build

# Buka port 3000 (default Next.js)
EXPOSE 3000

# Jalankan aplikasi Next.js
CMD ["npm", "start"]

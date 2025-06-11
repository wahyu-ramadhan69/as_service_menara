# Gunakan image kosong dan bangun manual
FROM scratch

# Salin semua file dari host, termasuk Node.js binary, npm, node_modules, dan seluruh project
COPY node /usr/bin/node
COPY npm /usr/bin/npm
COPY node_modules/ /app/node_modules/
COPY . /app

# Buat symlink jika dibutuhkan
# (optional tergantung path node/npm dalam container)
# RUN ln -s /usr/bin/node /usr/local/bin/node && ln -s /usr/bin/npm /usr/local/bin/npm

# Set working directory
WORKDIR /app

# Set permission execute (opsional kalau tidak bekerja)
# RUN chmod +x /usr/bin/node /usr/bin/npm

# Jalankan aplikasi
CMD ["/usr/bin/npm", "start"]

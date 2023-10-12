### How to use?

- Clone or download this repo
- Enter to the project directory
- Run `npm install`
- Run `npm run start:dev`
- Open browser and go to address `http://localhost:8000`
- Scan the QR Code
- Enjoy!

## Running In Server

### How To Running in Server :
- `sudo apt-get install -y libgbm1 libnss3 libatk-bridge2.0-0 libgtk-3-0 libgbm-dev`for library whatsappweb
- `npm install puppeteer@latest` for update dependancy to latest

### Server running 24h with PM2
Menjalankan diserver perlu package PM2, Untuk menggunakan process manager seperti PM2 untuk menjalankan aplikasi Node.js, Anda dapat mengikuti langkah-langkah berikut:

- Install PM2 melalui command-line dengan menjalankan perintah npm install pm2 -g. Jika Anda menggunakan server Linux, Anda mungkin perlu menambahkan sudo di depan perintah untuk menjalankan sebagai superuser.
- Masuk ke direktori aplikasi Node.js Anda di command-line dan jalankan perintah pm2 start <nama_file_app.js> untuk memulai aplikasi. Pastikan untuk mengganti <nama_file_app.js> dengan nama file yang benar.
- PM2 akan memulai aplikasi dan memberikan nomor id untuk memudahkan manajemen proses. Anda dapat menggunakan perintah pm2 list untuk melihat daftar proses yang sedang berjalan.
- Anda juga dapat menggunakan perintah pm2 stop <id> untuk menghentikan proses, atau pm2 restart <id> untuk memulai ulang proses.
- PM2 akan secara otomatis memulai aplikasi setelah restart atau kegagalan, sehingga aplikasi akan berjalan terus-menerus.
- Jika Anda ingin memastikan PM2 tetap berjalan di background, Anda dapat menggunakan perintah pm2 startup untuk memulai PM2 sebagai layanan sistem, sehingga PM2 akan memulai otomatis setelah reboot.

dapat membaca dokumentasi PM2 di https://pm2.keymetrics.io/.

### Migration
- Make Migration : `npx sequelize-cli migration:generate --name add_phone_to_users`
- Running Migration : `npx sequelize-cli db:migrate --config=config/database.js`
- Rollback Migration : `npx sequelize-cli db:migrate:undo --config=config/database.js`

## Endpoint Documentation : 
### POST send message (woowa eco)
https://wauputr4-urban-space-carnival-q55r9g7vqppf6w6-8000.preview.app.github.dev/api/send_message
PARAMS
number      :   +6289635219325
message     :   tes kirim pesan waaaaa

Body - formdata
key         :   wau2
phone_no    :   +6285157978344
message     :   tes wauwa api from wau2

#### more documentation here :
https://documenter.getpostman.com/view/20620862/2s93RNyuiE


# Whatsapp API Tutorial
Hi, this is the implementation example of <a href="https://github.com/pedroslopez/whatsapp-web.js">whatsapp-web.js</a>
Watch the tutorials:

- <a href="https://youtu.be/IRRiN2ZQDc8">Whatsapp API Tutorial: Part 1</a>
- <a href="https://youtu.be/hYpRQ_FE1JI">Whatsapp API Tutorial: Part 2</a>
- <a href="https://youtu.be/uBu7Zfba1zA">Whatsapp API Tutorial: Tips & Tricks</a>
- <a href="https://youtu.be/ksVBXF-6Jtc">Whatsapp API Tutorial: Sending Media File</a>
- <a href="https://youtu.be/uSzjbuaHexk">Whatsapp API Tutorial: Deploy to Heroku</a>
- <a href="https://youtu.be/5VfM9PvrYcE">Whatsapp API Tutorial: Multiple Device</a>
- <a href="https://youtu.be/Cq8ru8iKAVk">Whatsapp API Tutorial: Multiple Device | Part 2</a>
- <a href="https://youtu.be/bgxxUWqW6WU">Whatsapp API Tutorial: Fix Heroku Session</a>
- <a href="https://youtu.be/iode8kstDYQ">Whatsapp API Tutorial: Dynamic Message Reply</a>
- <a href="https://youtu.be/PF_MWklEQpM">Whatsapp API Tutorial: Fix Session & Support for Multi-Device Beta</a>
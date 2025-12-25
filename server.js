const express = require('express');
const app = express();
const path = require('path');

// Middleware untuk parsing JSON dengan limit besar (untuk gambar/video/audio base64)
app.use(express.json({ limit: '50mb' }));

// Melayani file statis (a.html dan b.html) dari folder saat ini
app.use(express.static(__dirname));

// Database sementara dalam memori
let messages = [];
let onlineUsers = {};

/**
 * API untuk mengambil semua pesan
 */
app.get('/api/messages', (req, res) => {
    res.json(messages);
});

/**
 * API untuk mengirim pesan baru (Teks, Gambar, Video, atau Audio)
 */
app.post('/api/messages', (req, res) => {
    const msg = { 
        ...req.body, 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    messages.push(msg);
    
    // Membatasi riwayat pesan agar tidak membebani memori server
    if (messages.length > 100) messages.shift();
    
    res.status(201).json({ status: 'OK' });
});

/**
 * API Heartbeat untuk melacak status online user
 */
app.post('/api/heartbeat', (req, res) => {
    const { userId } = req.body;
    if (userId) {
        onlineUsers[userId] = Date.now();
    }

    const sekarang = Date.now();
    // Jika user tidak mengirim heartbeat lebih dari 6 detik, anggap offline
    for (const id in onlineUsers) {
        if (sekarang - onlineUsers[id] > 6000) {
            delete onlineUsers[id];
        }
    }
    
    res.json({ usersOnline: Object.keys(onlineUsers) });
});

/**
 * API untuk menghapus seluruh riwayat chat
 */
app.delete('/api/messages', (req, res) => {
    messages = []; 
    res.json({ status: 'OK' });
});

// Menjalankan server pada port 3000
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`================================================`);
    console.log(`✅ Server WhatsApp Clone Berhasil Dijalankan!`);
    console.log(`🚀 URL User A: http://localhost:${PORT}/a.html`);
    console.log(`🚀 URL User B: http://localhost:${PORT}/b.html`);
    console.log(`================================================`);
});

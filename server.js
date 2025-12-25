const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json({ limit: '50mb' })); // Limit besar untuk kirim gambar/video base64
app.use(express.static('.')); // Melayani file a.html dan b.html di folder yang sama

// Database sementara dalam memori
let messages = [];
let onlineUsers = {}; // Menyimpan timestamp terakhir aktivitas user

// --- ENDPOINT API ---

// 1. Ambil semua pesan
app.get('/api/messages', (req, res) => {
    res.json(messages);
});

// 2. Kirim pesan baru
app.post('/api/messages', (req, res) => {
    const { senderId, text, image, audio } = req.body;
    
    const newMessage = {
        senderId,
        text,
        image, // string base64
        audio, // string base64
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    messages.push(newMessage);
    res.status(201).json(newMessage);
});

// 3. Hapus semua pesan
app.delete('/api/messages', (req, res) => {
    messages = [];
    res.json({ message: "Chat dibersihkan" });
});

// 4. Heartbeat (Cek status Online)
app.post('/api/heartbeat', (req, res) => {
    const { userId } = req.body;
    if (userId) {
        onlineUsers[userId] = Date.now(); // Update waktu terakhir aktif
    }

    // Filter user yang masih aktif dalam 5 detik terakhir
    const now = Date.now();
    const activeUsers = Object.keys(onlineUsers).filter(id => (now - onlineUsers[id]) < 5000);

    res.json({ usersOnline: activeUsers });
});

// Jalankan Server
app.listen(PORT, () => {
    console.log(`
    ✅ Server WhatsApp Clone berjalan!
    ----------------------------------
    Buka User A: http://localhost:${PORT}/a.html
    Buka User B: http://localhost:${PORT}/b.html
    `);
});

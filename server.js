const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

let messages = [];
let onlineUsers = {}; // Menyimpan timestamp aktif terakhir user

// API Ambil Pesan
app.get('/api/messages', (req, res) => res.json(messages));

// API Kirim Pesan
app.post('/api/messages', (req, res) => {
    const msg = { ...req.body, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    messages.push(msg);
    if (messages.length > 100) messages.shift();
    res.status(201).json({ status: 'OK' });
});

// API Heartbeat (Kunci Status Online)
app.post('/api/heartbeat', (req, res) => {
    const { userId } = req.body;
    onlineUsers[userId] = Date.now(); // Catat waktu aktif
    
    // Hapus yang tidak aktif lebih dari 8 detik
    const sekarang = Date.now();
    for (const id in onlineUsers) {
        if (sekarang - onlineUsers[id] > 8000) delete onlineUsers[id];
    }
    
    // Kirim jumlah user aktif (Jika 2 berarti A dan B online)
    res.json({ onlineCount: Object.keys(onlineUsers).length });
});

app.delete('/api/messages', (req, res) => { messages = []; res.json({ status: 'OK' }); });

app.listen(3000, () => console.log('Server running on http://localhost:3000'));

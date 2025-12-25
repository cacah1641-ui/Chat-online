const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');

// Gunakan /tmp untuk Vercel agar tidak error saat menulis file
const DB_FILE = process.env.NODE_ENV === 'production' ? '/tmp/messages.json' : './messages.json';

function loadMessages() {
    try {
        if (fs.existsSync(DB_FILE)) return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) { console.log("Database baru dibuat."); }
    return [];
}

function saveMessages(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (e) { console.error("Gagal simpan database!"); }
}

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

let messages = loadMessages();
let onlineUsers = {}; 

// Ambil pesan
app.get('/api/messages', (req, res) => {
    const room = req.query.room || 'Utama';
    res.json(messages.filter(m => m.room === room));
});

// Kirim pesan
app.post('/api/messages', (req, res) => {
    const { room, text, image, audio, senderId } = req.body;
    const newMessage = {
        room: room || 'Utama', text, image, audio, senderId,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    messages.push(newMessage);
    if (messages.length > 500) messages.shift();
    saveMessages(messages);
    res.status(201).json({ status: 'OK' });
});

// Status Online & Jumlah User
app.post('/api/heartbeat', (req, res) => {
    const { userId, room } = req.body;
    const now = Date.now();
    
    // Simpan/Update waktu aktif user
    onlineUsers[userId] = { room, lastSeen: now };

    // Hapus user yang sudah tidak aktif lebih dari 10 detik
    Object.keys(onlineUsers).forEach(id => {
        if (now - onlineUsers[id].lastSeen > 10000) delete onlineUsers[id];
    });

    const usersInRoom = Object.values(onlineUsers).filter(u => u.room === room);
    res.json({ 
        onlineCount: usersInRoom.length,
        isPeerOnline: usersInRoom.length > 1 
    });
});

app.delete('/api/messages', (req, res) => {
    messages = [];
    saveMessages(messages);
    res.json({ status: 'Cleared' });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
module.exports = app;

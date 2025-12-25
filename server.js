const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');

const DB_FILE = './messages.json';

// Fungsi memuat pesan dari database lokal
function loadMessages() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) { console.log("Database kosong, memulai baru."); }
    return [];
}

// Fungsi menyimpan pesan
function saveMessages(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (e) { console.error("Gagal menyimpan database!"); }
}

// PENTING: Menaikkan limit untuk Video dan Foto (50mb)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

let messages = loadMessages();
let onlineUsers = {}; // Objek untuk melacak status online

// API: Mengambil pesan
app.get('/api/messages', (req, res) => {
    const room = req.query.room || 'Utama';
    res.json(messages.filter(m => m.room === room));
});

// API: Mengirim pesan (Teks, Media, Audio)
app.post('/api/messages', (req, res) => {
    const { room, text, image, audio, senderId } = req.body;
    const newMessage = {
        room: room || 'Utama',
        text,
        image, // Data Base64 Foto/Video
        audio, // Data Base64 Voice Note
        senderId,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };
    
    messages.push(newMessage);
    if (messages.length > 500) messages.shift(); // Simpan 500 pesan terakhir saja
    saveMessages(messages);
    res.status(201).json({ status: 'Terkirim' });
});

// API: Hapus Chat
app.delete('/api/messages', (req, res) => {
    messages = [];
    saveMessages(messages);
    res.json({ status: 'Data dihapus' });
});

// API: Deteksi Online (Heartbeat)
app.post('/api/heartbeat', (req, res) => {
    const { userId, room } = req.body;
    const sekarang = Date.now();
    
    // Update waktu aktif terakhir user
    onlineUsers[userId] = { room, lastSeen: sekarang };

    // Hapus user yang tidak ada kabar lebih dari 10 detik
    for (const id in onlineUsers) {
        if (sekarang - onlineUsers[id].lastSeen > 10000) {
            delete onlineUsers[id];
        }
    }

    // Hitung jumlah user aktif di room tersebut
    const onlineCount = Object.values(onlineUsers).filter(u => u.room === room).length;
    res.json({ onlineCount: onlineCount });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server aktif di http://localhost:${PORT}`);
});

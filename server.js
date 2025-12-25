const express = require('express');
const path = require('path');
const app = express();

// Middleware: Parsing JSON dengan limit 50mb untuk mendukung kiriman Media (Base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database sementara dalam memori (Akan reset jika server idle di Vercel)
let messages = [];
let onlineUsers = {};

// Melayani file statis (a.html dan b.html)
app.use(express.static(path.join(__dirname, '/')));

/** * API Endpoints
 */

// Ambil semua pesan
app.get('/api/messages', (req, res) => {
    res.status(200).json(messages);
});

// Kirim pesan baru
app.post('/api/messages', (req, res) => {
    const { text, image, audio, senderId } = req.body;
    
    if (!senderId) return res.status(400).json({ error: "Sender ID diperlukan" });

    const newMessage = {
        senderId,
        text: text || '',
        image: image || null,
        audio: audio || null,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    messages.push(newMessage);
    
    // Batasi riwayat pesan di memori agar tidak crash (Max 100 pesan)
    if (messages.length > 100) messages.shift();
    
    res.status(201).json({ status: 'OK' });
});

// Heartbeat untuk status online
app.post('/api/heartbeat', (req, res) => {
    const { userId } = req.body;
    if (userId) {
        onlineUsers[userId] = Date.now();
    }

    const now = Date.now();
    // User dianggap offline jika tidak ada heartbeat selama lebih dari 8 detik
    const activeUsers = Object.keys(onlineUsers).filter(id => (now - onlineUsers[id]) < 8000);

    res.json({ usersOnline: activeUsers });
});

// Hapus chat
app.delete('/api/messages', (req, res) => {
    messages = [];
    res.json({ status: 'Deleted' });
});

// Ekspor app untuk Vercel
module.exports = app;

// Jalankan server jika dijalankan secara lokal
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server aktif di port ${PORT}`);
    });
}

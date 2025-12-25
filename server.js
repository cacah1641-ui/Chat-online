app.post('/api/heartbeat', (req, res) => {
    const { userId, room } = req.body;
    
    // Simpan waktu terakhir user terlihat
    onlineUsers[userId] = { room, lastSeen: Date.now() };

    // Bersihkan user yang sudah tidak mengirim heartbeat lebih dari 10 detik (dianggap offline)
    const now = Date.now();
    Object.keys(onlineUsers).forEach(id => {
        if (now - onlineUsers[id].lastSeen > 10000) {
            delete onlineUsers[id];
        }
    });

    // Hitung berapa user yang ada di room yang sama
    const usersInRoom = Object.values(onlineUsers).filter(u => u.room === room);
    const count = usersInRoom.length;

    res.json({ 
        onlineCount: count,
        status: count > 1 ? "Online" : "Offline" 
    });
});

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const routes = require('./routes');
const { initializeTables } = require('./db');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// 🔌 Socket.io for Real-time
const io = new Server(server, {
    cors: {
        origin: '*', // Adjust for production
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Pass IO to routes/controllers
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Routes
app.use('/api', routes);

// 🗄️ Initialize DB Tables
initializeTables();

// Socket Connection
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

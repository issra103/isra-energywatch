// Fix SSL pour Windows (doit être en tout premier)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const express  = require('express');
const http     = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');
const session  = require('express-session');
const { passport, initPassport } = require('./config/passport');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const iotRoutes      = require('./routes/iot.routes');
const energyRoutes   = require('./routes/energy.routes');
const simulateRoutes = require('./routes/simulate.routes');
const authRoutes     = require('./routes/auth.routes');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000' },
});

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Session & Passport
app.use(session({
  secret: process.env.JWT_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // false pour dev localhost
}));
initPassport();
app.use(passport.initialize());
app.use(passport.session());

app.set('io', io);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/iot',      iotRoutes);
app.use('/api/energy',   energyRoutes);
app.use('/api/simulate', simulateRoutes);

app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ─── MongoDB ──────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('[DB] MongoDB connecte'))
  .catch(err => { console.error('[DB] Erreur :', err.message); process.exit(1); });

// ─── Socket.io ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Socket] Client connecte : ${socket.id}`);
  socket.on('disconnect', () => console.log(`[Socket] Deconnecte : ${socket.id}`));
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`[API] Serveur sur http://localhost:${PORT}`));

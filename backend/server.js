require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database');

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');

const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

// Handle CORS (still useful for local dev)
const corsOptions = {
  origin: true,
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

// SERVE FRONTEND (Monolith Mode)
// This serves the built frontend files from the 'frontend/dist' folder
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

// Health check
app.get('/health', (req, res) => {
    res.json({ message: 'ABS backend is running' });
});

// SPA Routing: Send index.html for any non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendPath, 'index.html'));
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ 
        error: 'Internal Server Error', 
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Export for testing
module.exports = app;

if (require.main === module) {
    db.init().then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }).catch(err => {
        console.error('Failed to initialize database', err);
    });
}

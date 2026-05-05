require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database');

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS for local development and production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'https://abs-atv.pages.dev',
];

// Add Render frontend if specified
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// Add Cloudflare frontend if specified
if (process.env.CLOUDFLARE_URL) {
  allowedOrigins.push(process.env.CLOUDFLARE_URL);
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like curl requests or mobile apps)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Log for debugging
      console.log(`CORS blocked origin: ${origin}`);
      callback(null, true); // Allow for now for debugging
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'ABS backend is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

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

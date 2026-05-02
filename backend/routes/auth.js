const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');

// Helper to generate a 10-digit account number
const generateAccountNumber = () => {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

const isPositiveOrZeroNumber = (value) => {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0;
};

const normalizeNigerianPhone = (phone) => {
    const cleaned = String(phone).replace(/[\s-]/g, '');

    if (/^0[789][01]\d{8}$/.test(cleaned)) {
        return `+234${cleaned.slice(1)}`;
    }

    if (/^\+234[789][01]\d{8}$/.test(cleaned)) {
        return cleaned;
    }

    if (/^234[789][01]\d{8}$/.test(cleaned)) {
        return `+${cleaned}`;
    }

    return null;
};

// Create Account
router.post('/register', async (req, res) => {
    const { name, email, phone, pin, initial_deposit } = req.body;

    if (!name || !email || !phone || !pin || initial_deposit === undefined) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    if (!isPositiveOrZeroNumber(initial_deposit)) {
        return res.status(400).json({ error: 'Initial deposit must be a valid non-negative amount.' });
    }

    if (!/^\d{4,}$/.test(pin)) {
        return res.status(400).json({ error: 'PIN must contain at least 4 digits.' });
    }

    const normalizedPhone = normalizeNigerianPhone(phone);
    if (!normalizedPhone) {
        return res.status(400).json({ error: 'Enter a valid Nigerian phone number.' });
    }

    try {
        const hashedPin = await bcrypt.hash(pin, 10);
        let accountNumber = generateAccountNumber();

        // Optional: check if account number exists (very low probability of collision)

        db.run(
            `INSERT INTO Users (name, email, phone, account_number, pin, balance) VALUES (?, ?, ?, ?, ?, ?)`,
            [name, email, normalizedPhone, accountNumber, hashedPin, initial_deposit],
            function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed: Users.email')) {
                        return res.status(400).json({ error: 'Email already exists.' });
                    }
                    return res.status(500).json({ error: 'Database error.', details: err.message });
                }

                // If initial deposit > 0, log transaction
                if (initial_deposit > 0) {
                    db.run(
                        `INSERT INTO Transactions (account_number, type, amount) VALUES (?, ?, ?)`,
                        [accountNumber, 'Deposit', initial_deposit]
                    );
                }

                res.status(201).json({ message: 'Account created successfully', account_number: accountNumber });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
router.post('/login', (req, res) => {
    const { account_number, pin } = req.body;

    if (!account_number || !pin) {
        return res.status(400).json({ error: 'Account number and PIN are required.' });
    }

    db.get(`SELECT * FROM Users WHERE account_number = ?`, [account_number], async (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user) return res.status(401).json({ error: 'Invalid account number or PIN.' });

        const isMatch = await bcrypt.compare(pin, user.pin);
        if (!isMatch) return res.status(401).json({ error: 'Invalid account number or PIN.' });

        const token = jwt.sign(
            { user_id: user.user_id, account_number: user.account_number },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '1h' }
        );

        res.json({ message: 'Login successful', token, user: { name: user.name, account_number: user.account_number, balance: user.balance } });
    });
});

// Change PIN
router.post('/change-pin', authMiddleware, (req, res) => {
    const { current_pin, new_pin } = req.body;

    if (!current_pin || !new_pin) {
        return res.status(400).json({ error: 'Current PIN and new PIN are required.' });
    }

    if (!/^\d{4,}$/.test(new_pin)) {
        return res.status(400).json({ error: 'New PIN must contain at least 4 digits.' });
    }

    db.get(`SELECT * FROM Users WHERE account_number = ?`, [req.user.account_number], async (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const isMatch = await bcrypt.compare(current_pin, user.pin);
        if (!isMatch) return res.status(401).json({ error: 'Current PIN is incorrect.' });

        const hashedPin = await bcrypt.hash(new_pin, 10);
        db.run(`UPDATE Users SET pin = ? WHERE account_number = ?`, [hashedPin, req.user.account_number], function(updateErr) {
            if (updateErr) return res.status(500).json({ error: 'Database error' });

            res.json({ message: 'PIN changed successfully.' });
        });
    });
});

// Logout (Handled primarily on frontend by removing token, but here we can just return success)
router.post('/logout', (req, res) => {
    res.json({ message: 'Logout successful.' });
});

module.exports = router;

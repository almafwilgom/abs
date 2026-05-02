const express = require('express');
const router = express.Router();
const db = require('../database');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

const parseAmount = (amount) => {
    const parsed = Number(amount);
    return Number.isFinite(parsed) ? parsed : NaN;
};

// Get Balance
router.get('/balance', (req, res) => {
    db.get(`SELECT balance FROM Users WHERE account_number = ?`, [req.user.account_number], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!row) return res.status(404).json({ error: 'User not found' });
        
        res.json({ balance: row.balance });
    });
});

// Deposit
router.post('/deposit', (req, res) => {
    const amount = parseAmount(req.body.amount);
    
    if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Valid deposit amount is required.' });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run(`UPDATE Users SET balance = balance + ? WHERE account_number = ?`, [amount, req.user.account_number], function(err) {
            if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: 'Database error' });
            }

            db.run(`INSERT INTO Transactions (account_number, type, amount) VALUES (?, ?, ?)`, [req.user.account_number, 'Deposit', amount], function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: 'Database error during transaction log' });
                }

                db.run('COMMIT');
                
                // Get updated balance
                db.get(`SELECT balance FROM Users WHERE account_number = ?`, [req.user.account_number], (err, row) => {
                    res.json({ message: 'Deposit successful', new_balance: row.balance });
                });
            });
        });
    });
});

// Withdraw
router.post('/withdraw', (req, res) => {
    const amount = parseAmount(req.body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Valid withdrawal amount is required.' });
    }

    db.get(`SELECT balance FROM Users WHERE account_number = ?`, [req.user.account_number], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!row) return res.status(404).json({ error: 'User not found' });

        if (row.balance < amount) {
            return res.status(400).json({ error: 'Insufficient funds.' });
        }

        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            db.run(`UPDATE Users SET balance = balance - ? WHERE account_number = ?`, [amount, req.user.account_number], function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: 'Database error' });
                }

                db.run(`INSERT INTO Transactions (account_number, type, amount) VALUES (?, ?, ?)`, [req.user.account_number, 'Withdraw', amount], function(err) {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: 'Database error during transaction log' });
                    }

                    db.run('COMMIT');
                    
                    db.get(`SELECT balance FROM Users WHERE account_number = ?`, [req.user.account_number], (err, row) => {
                        res.json({ message: 'Withdrawal successful', new_balance: row.balance });
                    });
                });
            });
        });
    });
});

// Transaction History
router.get('/history', (req, res) => {
    db.all(`SELECT * FROM Transactions WHERE account_number = ? ORDER BY transaction_id DESC`, [req.user.account_number], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        
        res.json({ transactions: rows });
    });
});

module.exports = router;

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'bank.sqlite');

// Ensure directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

let db;

async function initDB() {
    return new Promise((resolve, reject) => {
        try {
            db = new Database(dbPath);
            db.pragma('journal_mode = WAL');
            db.pragma('foreign_keys = ON');

            // Create Users table
            db.exec(`CREATE TABLE IF NOT EXISTS Users (
                user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                phone TEXT NOT NULL,
                account_number TEXT UNIQUE NOT NULL,
                pin TEXT NOT NULL,
                balance REAL DEFAULT 0.0 CHECK(balance >= 0)
            )`);

            // Create Transactions table
            db.exec(`CREATE TABLE IF NOT EXISTS Transactions (
                transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
                account_number TEXT NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('Deposit', 'Withdraw')),
                amount REAL NOT NULL CHECK(amount > 0),
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (account_number) REFERENCES Users(account_number)
            )`);

            console.log('Database initialized successfully');
            resolve();
        } catch (err) {
            console.error('Error initializing database:', err);
            reject(err);
        }
    });
}

module.exports = {
    init: initDB,
    run: function(sql, params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        try {
            const stmt = db.prepare(sql);
            const result = stmt.run(...params);
            console.log(`DB RUN Success: ${sql.substring(0, 50)}...`);
            if (callback) {
                callback.call({ lastID: result.lastInsertRowid }, null);
            }
        } catch (err) {
            console.error(`DB RUN Error [${sql.substring(0, 50)}...]:`, err);
            if (callback) callback(err);
        }
    },
    get: function(sql, params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        try {
            const stmt = db.prepare(sql);
            const row = stmt.get(...params);
            if (callback) callback(null, row);
        } catch (err) {
            console.error(`DB GET Error [${sql.substring(0, 50)}...]:`, err);
            if (callback) callback(err);
        }
    },
    all: function(sql, params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        try {
            const stmt = db.prepare(sql);
            const rows = stmt.all(...params);
            if (callback) callback(null, rows);
        } catch (err) {
            console.error(`DB ALL Error [${sql.substring(0, 50)}...]:`, err);
            if (callback) callback(err);
        }
    },
    serialize: function(callback) {
        callback(); // better-sqlite3 is synchronous
    },
    close: function(callback) {
        if (db) {
            db.close();
            if (callback) callback();
        }
    }
};

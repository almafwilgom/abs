const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'bank.sqlite');
let db;

async function initDB() {
    const SQL = await initSqlJs();
    if (fs.existsSync(dbPath)) {
        const filebuffer = fs.readFileSync(dbPath);
        db = new SQL.Database(filebuffer);
        db.run('PRAGMA foreign_keys = ON;');
        console.log('Loaded existing database.');
    } else {
        db = new SQL.Database();
        
        db.run('PRAGMA foreign_keys = ON;');

        db.run(`CREATE TABLE Users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT NOT NULL,
            account_number TEXT UNIQUE NOT NULL,
            pin TEXT NOT NULL,
            balance REAL DEFAULT 0.0 CHECK(balance >= 0)
        )`);

        db.run(`CREATE TABLE Transactions (
            transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_number TEXT NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('Deposit', 'Withdraw')),
            amount REAL NOT NULL CHECK(amount > 0),
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (account_number) REFERENCES Users(account_number)
        )`);

        saveDB();
        console.log('Created new database.');
    }
}

function saveDB() {
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
}

// Custom wrapper to mimic sqlite3 async api
module.exports = {
    init: initDB,
    run: function(sql, params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        try {
            db.run(sql, params);
            saveDB();
            
            // To get lastID, we can just query it. Not perfect but works for this scope.
            let lastID = null;
            if (sql.trim().toUpperCase().startsWith('INSERT')) {
                const res = db.exec("SELECT last_insert_rowid()")[0];
                if (res && res.values && res.values.length > 0) {
                    lastID = res.values[0][0];
                }
            }
            if (callback) callback.call({ lastID }, null);
        } catch (err) {
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
            stmt.bind(params);
            if (stmt.step()) {
                const row = stmt.getAsObject();
                stmt.free();
                if (callback) callback(null, row);
            } else {
                stmt.free();
                if (callback) callback(null, undefined);
            }
        } catch (err) {
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
            stmt.bind(params);
            const rows = [];
            while(stmt.step()) {
                rows.push(stmt.getAsObject());
            }
            stmt.free();
            if (callback) callback(null, rows);
        } catch (err) {
            if (callback) callback(err);
        }
    },
    serialize: function(callback) {
        callback(); // sql.js is synchronous anyway
    }
};

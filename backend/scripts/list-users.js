const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const dbPath = process.env.DB_PATH || path.resolve(__dirname, '..', 'bank.sqlite');

async function main() {
    if (!fs.existsSync(dbPath)) {
        console.error(`Database not found: ${dbPath}`);
        process.exit(1);
    }

    const SQL = await initSqlJs();
    const db = new SQL.Database(fs.readFileSync(dbPath));

    const result = db.exec(`
        SELECT
            user_id,
            name,
            email,
            phone,
            account_number,
            balance,
            pin AS pin_hash
        FROM Users
        ORDER BY user_id ASC
    `);

    if (!result[0] || result[0].values.length === 0) {
        console.log('No registered users found.');
        return;
    }

    const { columns, values } = result[0];
    const users = values.map((row) => {
        return columns.reduce((user, column, index) => {
            user[column] = row[index];
            return user;
        }, {});
    });

    console.table(users);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});

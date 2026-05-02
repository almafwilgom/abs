const request = require('supertest');
const fs = require('fs');
const path = require('path');

process.env.DB_PATH = path.resolve(__dirname, 'test-bank.sqlite');
process.env.JWT_SECRET = 'test_secret';

const app = require('../server');
const db = require('../database');

let token;
let accountNumber;

beforeAll(async () => {
    if (fs.existsSync(process.env.DB_PATH)) {
        fs.unlinkSync(process.env.DB_PATH);
    }
    await db.init();
});

afterAll(() => {
    if (fs.existsSync(process.env.DB_PATH)) {
        fs.unlinkSync(process.env.DB_PATH);
    }
});

describe('Banking System API Endpoints', () => {
    it('should create a new account', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test User',
                email: 'test@example.com',
                phone: '08012345678',
                pin: '1234',
                initial_deposit: 100
            });
        
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('account_number');
        accountNumber = res.body.account_number;
    });

    it('should fail to create account with negative initial deposit', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test User 2',
                email: 'test2@example.com',
                phone: '08012345679',
                pin: '1234',
                initial_deposit: -50
            });
        
        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toBe('Initial deposit must be a valid non-negative amount.');
    });

    it('should reject non-Nigerian phone numbers', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test User 3',
                email: 'test3@example.com',
                phone: '1234567890',
                pin: '1234',
                initial_deposit: 100
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toBe('Enter a valid Nigerian phone number.');
    });

    it('should login and return a token', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                account_number: accountNumber,
                pin: '1234'
            });
        
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
        token = res.body.token;
    });

    it('should return current balance', async () => {
        const res = await request(app)
            .get('/api/transactions/balance')
            .set('Authorization', `Bearer ${token}`);
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.balance).toEqual(100);
    });

    it('should update balance correctly on deposit', async () => {
        const res = await request(app)
            .post('/api/transactions/deposit')
            .set('Authorization', `Bearer ${token}`)
            .send({ amount: 50 });
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.new_balance).toEqual(150);
    });

    it('should fail withdrawal with insufficient funds', async () => {
        const res = await request(app)
            .post('/api/transactions/withdraw')
            .set('Authorization', `Bearer ${token}`)
            .send({ amount: 500 });
        
        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toBe('Insufficient funds.');
    });

    it('should prevent negative withdrawal', async () => {
        const res = await request(app)
            .post('/api/transactions/withdraw')
            .set('Authorization', `Bearer ${token}`)
            .send({ amount: -50 });
        
        expect(res.statusCode).toEqual(400);
    });

    it('should correctly log transaction history', async () => {
        const res = await request(app)
            .get('/api/transactions/history')
            .set('Authorization', `Bearer ${token}`);
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.transactions.length).toBeGreaterThanOrEqual(2); // initial deposit + recent deposit
        expect(res.body.transactions[1].type).toBe('Deposit');
        expect(res.body.transactions[0].amount).toBe(50);
    });

    it('should reject PIN change when current PIN is wrong', async () => {
        const res = await request(app)
            .post('/api/auth/change-pin')
            .set('Authorization', `Bearer ${token}`)
            .send({ current_pin: '0000', new_pin: '5678' });

        expect(res.statusCode).toEqual(401);
        expect(res.body.error).toBe('Current PIN is incorrect.');
    });

    it('should reject PIN change when new PIN is too short', async () => {
        const res = await request(app)
            .post('/api/auth/change-pin')
            .set('Authorization', `Bearer ${token}`)
            .send({ current_pin: '1234', new_pin: '12' });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toBe('New PIN must contain at least 4 digits.');
    });

    it('should change PIN and require the new PIN on next login', async () => {
        const changeRes = await request(app)
            .post('/api/auth/change-pin')
            .set('Authorization', `Bearer ${token}`)
            .send({ current_pin: '1234', new_pin: '5678' });

        expect(changeRes.statusCode).toEqual(200);
        expect(changeRes.body.message).toBe('PIN changed successfully.');

        const oldPinRes = await request(app)
            .post('/api/auth/login')
            .send({
                account_number: accountNumber,
                pin: '1234'
            });

        expect(oldPinRes.statusCode).toEqual(401);

        const newPinRes = await request(app)
            .post('/api/auth/login')
            .send({
                account_number: accountNumber,
                pin: '5678'
            });

        expect(newPinRes.statusCode).toEqual(200);
        expect(newPinRes.body).toHaveProperty('token');
    });
});

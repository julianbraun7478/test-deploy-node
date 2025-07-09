const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/auth');
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth API', () => {
    it('should request a verification code', async () => {
        const res = await request(app)
            .post('/api/auth/request-verification')
            .send({ email: 'test@example.com' });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Verification code sent to your email');
    });

    it('should verify email with correct code', async () => {
        // Mock verifyCode to return true
        require('../services/emailService').verifyCode = jest.fn(() => true);
        const res = await request(app)
            .post('/api/auth/verify-email')
            .send({ email: 'test@example.com', code: '1234' });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Email verified successfully');
    });

    it('should fail to verify with incorrect code', async () => {
        require('../services/emailService').verifyCode = jest.fn(() => false);
        const res = await request(app)
            .post('/api/auth/verify-email')
            .send({ email: 'test@example.com', code: '5678' });
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('error', 'Invalid or expired verification code');
    });

    it('should set a valid password', async () => {
        require('firebase/auth').createUserWithEmailAndPassword = jest.fn(() =>
            Promise.resolve({
                user: { uid: '123', email: 'test@example.com', getIdToken: () => Promise.resolve('mock-token') },
            })
        );
        const res = await request(app)
            .post('/api/auth/set-password')
            .send({ email: 'test@example.com', password: 'Password123' });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('message', 'Account created successfully');
    });

    it('should fail to set an invalid password', async () => {
        const res = await request(app)
            .post('/api/auth/set-password')
            .send({ email: 'test@example.com', password: 'weak' });
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('error', 'Password must be at least 8 characters and include a number');
    });

    it('should confirm matching passwords', async () => {
        const res = await request(app)
            .post('/api/auth/confirm-password')
            .send({ email: 'test@example.com', password: 'Password123', confirmPassword: 'Password123' });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Password confirmed successfully');
    });

    it('should fail to confirm mismatched passwords', async () => {
        const res = await request(app)
            .post('/api/auth/confirm-password')
            .send({ email: 'test@example.com', password: 'Password123', confirmPassword: 'Mismatch123' });
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('error', 'Passwords do not match');
    });
});
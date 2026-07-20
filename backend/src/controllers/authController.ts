import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const loginSchema = z.object({
    username: z.string().min(1, 'Username wajib diisi'),
    password: z.string().min(1, 'Password wajib diisi'),
});
import jwt from 'jsonwebtoken';
import prisma from '../config/db';

export const login = async (req: Request, res: Response) => {
    try {
        const validationResult = loginSchema.safeParse(req.body);
        
        if (!validationResult.success) {
            return res.status(400).json({ 
                message: validationResult.error.issues[0].message 
            });
        }

        const { username, password } = validationResult.data;

        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({ message: 'Internal server error: JWT_SECRET not configured' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, namaLengkap: user.namaLengkap, inisialDc: user.inisialDc },
            secret,
            { expiresIn: '1d' }
        );

        res.json({ token, message: 'Login successful', user: { id: user.id, username: user.username, namaLengkap: user.namaLengkap, inisialDc: user.inisialDc } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

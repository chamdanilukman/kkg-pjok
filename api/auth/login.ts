import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../lib/db';

export default async function handler(req: any, res: any) {
    const JWT_SECRET = process.env.JWT_SECRET || process.env.VITE_JWT_SECRET;
    if (!JWT_SECRET) {
        return res.status(500).json({ message: 'JWT secret not configured' });
    }
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        // Find user
        const users = await query('SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL', [email]);
        if (users.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = users.rows[0];

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Update last login
        await query('UPDATE users SET last_login_at = now() WHERE id = $1', [user.id]);

        // Remove password_hash from response
        const { password_hash, ...safeUser } = user;

        return res.status(200).json({
            message: 'Logged in successfully',
            token,
            user: safeUser
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

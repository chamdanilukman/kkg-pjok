import jwt from 'jsonwebtoken';

export function verifyToken(req: any) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Unauthorized');
    }

    const token = authHeader.split(' ')[1];
    const JWT_SECRET = process.env.JWT_SECRET || process.env.VITE_JWT_SECRET;
    if (!JWT_SECRET) {
        throw new Error('JWT Secret not configured');
    }

    return jwt.verify(token, JWT_SECRET) as any;
}

export function isAdmin(user: any) {
    return user && user.role === 'admin';
}

export function isBendaharaOrAdmin(user: any) {
    return user && (user.role === 'admin' || user.role === 'bendahara');
}

export function isSekretarisOrAdmin(user: any) {
    return user && (user.role === 'admin' || user.role === 'sekretaris');
}

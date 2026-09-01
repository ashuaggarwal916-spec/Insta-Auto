import jwt from 'jsonwebtoken';

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as any;
  } catch { return null; }
}

// lib/auth.ts

import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const secret = new TextEncoder().encode(JWT_SECRET);

export const generateToken = async (payload: any): Promise<string> => {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Token berlaku 7 hari
    .sign(secret);
};

// ✅ Tambahkan fungsi verifyToken
export const verifyToken = async (token: string) => {
  try {
    const { payload  } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
};
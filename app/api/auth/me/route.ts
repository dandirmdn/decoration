// app/api/auth/me/route.ts

import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  // ✅ Ambil token dari cookie
  const token = req.cookies.get('auth-token')?.value;

  if (!token) {
    return new Response(
      JSON.stringify({ message: 'Akses ditolak.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return new Response(
      JSON.stringify({ message: 'Token tidak valid.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ user: decoded }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
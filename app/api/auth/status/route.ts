// app/api/auth/status/route.ts

import { NextRequest } from 'next/server';
import { verifyToken } from '../../../../lib/auth';

export async function GET(req: NextRequest) {
  // ✅ Ambil token dari cookie
  const token = req.cookies.get('auth-token')?.value;

  if (!token) {
    return new Response(
      JSON.stringify({ isLoggedIn: false }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const decoded = await verifyToken(token); // Gunakan await karena verifyToken sekarang async

  if (!decoded) {
    return new Response(
      JSON.stringify({ isLoggedIn: false }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Jika token valid, kembalikan data user
  return new Response(
    JSON.stringify({ isLoggedIn: true, user: { id: decoded.id, name: decoded.name, email: decoded.email } }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
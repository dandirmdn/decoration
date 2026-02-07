// middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose'; // Ganti import dari jsonwebtoken

// Rute yang tidak perlu auth
const publicPaths = ['/auth/login', '/auth/register', '/'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;


  // Jika rute adalah publik, lewati middleware
  if (publicPaths.includes(pathname)) {
    console.log('Public path, skipping auth check'); // Debug log
    return NextResponse.next();
  }

  // Ambil token dari cookie
  const cookie = req.cookies.get('auth-token');

  if (!cookie) {
    console.log('No auth-token cookie found, redirecting to /auth/login'); // Debug log
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  const token = cookie.value;

  if (!token) {
    console.log('Token is empty, redirecting to /auth/login'); // Debug log
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  try {
    // Verifikasi token menggunakan jose
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');
    const decoded = await jwtVerify(token, secret);
    console.log('Token verified, decoded:', decoded); // Debug log
    // Jika valid, lanjutkan
    return NextResponse.next();
  } catch (err) {
    console.error('Token verification failed:', err); // Debug log
    // Jika token tidak valid, redirect ke login
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }
}

// Atur rute mana yang akan dijalani middleware
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'], // Jalankan middleware untuk semua rute kecuali static files
};
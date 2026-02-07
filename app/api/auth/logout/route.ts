// app/api/auth/logout/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Buat response kosong
    const response = NextResponse.json({ message: 'Logout berhasil' });

    // Hapus cookie 'auth-token'
    // Anda bisa menyetel expiry ke tanggal di masa lalu untuk "menghapus" cookie
    response.cookies.delete('auth-token');

    // Atau, jika ingin lebih eksplisit:
    // response.cookies.set('auth-token', '', {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === 'production',
    //   maxAge: 0, // Segera kadaluarsa
    //   path: '/',
    //   sameSite: 'strict',
    // });

    return response;
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat logout' },
      { status: 500 }
    );
  }
}
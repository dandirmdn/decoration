// app/api/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import { generateToken } from '@/lib/auth'; // Pastikan menggunakan jose

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Validasi input
    if (!email || !password) {
      return new Response(
        JSON.stringify({ message: 'Email dan password harus diisi.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return new Response(
        JSON.stringify({ message: 'Email atau password salah.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verifikasi password menggunakan argon2
    const isPasswordValid = await argon2.verify(user.password, password);

    if (!isPasswordValid) {
      return new Response(
        JSON.stringify({ message: 'Email atau password salah.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Jangan kembalikan password
    const { password: _, ...userWithoutPassword } = user;

    // ✅ Generate JWT token menggunakan jose
    const token = await generateToken({ sub: user.id, email: user.email, name: user.name }); // Tambahkan name jika ingin ditampilkan di navbar

    // Buat response
    const response = new NextResponse(
      JSON.stringify({ message: 'Login berhasil.', user: userWithoutPassword, token }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

    // Set cookie dengan token
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 hari
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Error logging in:', error);
    return new Response(
      JSON.stringify({ message: 'Terjadi kesalahan server.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await prisma.$disconnect();
  }
}
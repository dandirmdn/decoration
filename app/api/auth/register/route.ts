// app/api/auth/register/route.ts

import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    // Validasi input
    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ message: 'Semua field harus diisi.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Cek apakah user sudah ada
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return new Response(
        JSON.stringify({ message: 'Email sudah terdaftar.' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Hash password menggunakan argon2
    const hashedPassword = await argon2.hash(password);

    // Simpan user baru
    const newUser = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
        },
    });

    // Jangan kembalikan password
    const { password: _, ...userWithoutPassword } = newUser;

    return new Response(
      JSON.stringify({ message: 'Registrasi berhasil.', user: userWithoutPassword }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error registering user:', error);
    return new Response(
      JSON.stringify({ message: 'Terjadi kesalahan server.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await prisma.$disconnect();
  }
}
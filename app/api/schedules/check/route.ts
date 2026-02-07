// app/api/schedules/check/route.ts

import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // Ambil token dari cookie
    const token = req.cookies.get('auth-token')?.value;

    if (!token) {
      return new Response(
        JSON.stringify({ message: 'Akses ditolak.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const decoded = await verifyToken(token);

    if (!decoded) {
      return new Response(
        JSON.stringify({ message: 'Token tidak valid.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { date } = await req.json();

    if (!date) {
      return new Response(
        JSON.stringify({ message: 'Tanggal harus diisi.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Cek apakah tanggal sudah di-book di tabel Schedule
    const existingSchedule = await prisma.schedule.findFirst({
      where: {
        date: new Date(date),
      },
    });

    if (existingSchedule) {
      return new Response(
        JSON.stringify({ isBooked: true }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ isBooked: false }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking schedule:', error);
    return new Response(
      JSON.stringify({ message: 'Gagal memeriksa jadwal.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await prisma.$disconnect();
  }
}
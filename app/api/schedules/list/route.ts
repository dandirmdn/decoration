// app/api/schedules/list/route.ts

import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Ambil semua tanggal dari tabel Schedule
    const schedules = await prisma.schedule.findMany({
      select: {
        date: true,
      },
    });

    // Format tanggal ke string ISO (atau format yang mudah diproses di client)
    const bookedDates = schedules.map(schedule => schedule.date.toISOString().split('T')[0]);

    return new Response(
      JSON.stringify({ bookedDates }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return new Response(
      JSON.stringify({ message: 'Gagal mengambil jadwal.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await prisma.$disconnect();
  }
}
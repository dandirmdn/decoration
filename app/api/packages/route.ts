// app/api/packages/route.ts

import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // ✅ Ambil semua paket
    const packages = await prisma.package.findMany({
      include: {
        package_items: true,
      },
    });

    return new Response(
      JSON.stringify(packages),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching packages:', error);
    return new Response(
      JSON.stringify({ message: 'Gagal mengambil data paket.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await prisma.$disconnect();
  }
}
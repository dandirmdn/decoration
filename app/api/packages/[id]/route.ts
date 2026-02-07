// app/api/packages/[id]/route.ts

import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

// ✅ Jadikan fungsi GET menjadi async
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // params sekarang Promise
) {
  // ✅ Gunakan await untuk mengakses params
  const { id } = await params;

  try {
    const pkg = await prisma.package.findUnique({
      where: { id },
      include: {
        package_items: true,
      },
    });

    if (!pkg) {
      return new Response(
        JSON.stringify({ message: 'Paket tidak ditemukan.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(pkg),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching package:', error);
    return new Response(
      JSON.stringify({ message: 'Gagal mengambil data paket.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await prisma.$disconnect();
  }
}
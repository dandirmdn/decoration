// app/api/orders/[id]/route.ts

import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // params sekarang Promise
) {
  const { id } = await params; // ✅ Await params



  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        package: {
          include: {
            package_items: true,
          },
        },
      },
    });

    if (!order) {
      return new Response(
        JSON.stringify({ message: 'Pesanan tidak ditemukan.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(order),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching order:', error);
    return new Response(
      JSON.stringify({ message: 'Gagal mengambil data pesanan.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await prisma.$disconnect();
  }
}
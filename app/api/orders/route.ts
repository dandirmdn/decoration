// app/api/orders/route.ts

import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
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

  try {
    const orders = await prisma.order.findMany({
      where: { user_id: decoded.sub },
      include: {
        package: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return new Response(
      JSON.stringify(orders),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching orders:', error);
    return new Response(
      JSON.stringify({ message: 'Gagal mengambil pesanan.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await prisma.$disconnect();
  }
}
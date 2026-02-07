// app/api/orders/create/route.ts

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

    const userId = decoded.sub

    const {
      packageId,
      totalAmount,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      scheduleDate,
    } = await req.json();

    console.log(packageId, userId, totalAmount, customerName, customerEmail, customerPhone, customerAddress, scheduleDate);
    // Validasi input
    if (!packageId || !userId || !totalAmount || !customerName || !customerEmail || !customerPhone || !customerAddress || !scheduleDate) {
      return new Response(
        JSON.stringify({ message: 'Semua field harus diisi.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }


    // Ambil data paket
    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
    });

    if (!pkg) {
      return new Response(
        JSON.stringify({ message: 'Paket tidak ditemukan.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Hitung DP dan Final
    const dpAmount = Math.round(pkg.price * 0.3);
    const finalAmount = pkg.price - dpAmount;

    // Buat schedule baru
    const schedule = await prisma.schedule.create({
      data: {
        date: new Date(scheduleDate),
      },
    });

    // Buat order
    const order = await prisma.order.create({
       data: {
        user_id: userId,
        package_id: packageId,
        total_amount: totalAmount,
        dp_amount: dpAmount,
        final_amount: finalAmount,
        status: 'PENDING',
        dp_status: 'PENDING',
        final_status: 'PENDING',
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        schedule_date: new Date(scheduleDate),
      },
    });

    return new Response(
      JSON.stringify({ message: 'Pesanan dibuat.', orderId: order.id }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating order:', error);
    return new Response(
      JSON.stringify({ message: 'Gagal membuat pesanan.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await prisma.$disconnect();
  }
}
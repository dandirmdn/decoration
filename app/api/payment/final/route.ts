// app/api/payment/final/route.ts

import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';
import { Buffer } from 'buffer';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { orderId, userId, totalAmount, finalAmount } = await req.json(); // Terima orderId dan finalAmount

    // Ambil token dari cookie
    const token = req.cookies.get('auth-token')?.value;

    if (!token) {
      return new Response(
        JSON.stringify({ message: 'Token tidak valid.' }),
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


    // Ambil data order berdasarkan orderId
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        package: true,
      },
    });

    if (!order) {
      return new Response(
        JSON.stringify({ message: 'Pesanan tidak ditemukan.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }



    // Pastikan DP sudah dibayar, dan pelunasan belum
    if (order.dp_status !== 'PAID') {
      return new Response(
        JSON.stringify({ message: 'DP belum dibayar. Tidak bisa melunasi sebelum DP.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (order.final_status === 'PAID') {
      return new Response(
        JSON.stringify({ message: 'Pelunasan sudah dibayar.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Ambil server key dari environment
    const serverKey = process.env.MIDTRANS_SERVER_KEY;

    if (!serverKey) {
      return new Response(
        JSON.stringify({ message: 'Server key Midtrans tidak ditemukan.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Buat header authorization sesuai dokumentasi Midtrans
    const authString = serverKey + ':';
    const encodedAuth = Buffer.from(authString).toString('base64');
    const authorizationHeader = `Basic ${encodedAuth}`;

    // ✅ Gunakan order.id + '_final' sebagai order_id Midtrans untuk Pelunasan
    const midtransOrderId = `${order.id}_final`;

    // Payload untuk Midtrans (pelunasan)
    const payload = {
      transaction_details: {
        order_id: midtransOrderId, // ✅ Gunakan ID unik untuk Pelunasan
        gross_amount: finalAmount, // Bayar pelunasan
      },
      item_details: [
        {
          id: order.package_id,
          price: finalAmount,
          quantity: 1,
          name: `${order.package.name} - Pelunasan`,
        },
      ],
      customer_details: {
        email: decoded.email,
        first_name: decoded.name || 'Customer',
      },
    };

    // Kirim ke API Midtrans
    const res = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': authorizationHeader,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error('Midtrans API Error:', errorData);
      return new Response(
        JSON.stringify({ message: 'Gagal membuat pembayaran di Midtrans.', error: errorData }),
        { status: res.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const responseData = await res.json();
    const redirectUrl = responseData.redirect_url;

    // ✅ Update order dengan transactionId Pelunasan (ini adalah transaction_id dari Midtrans, bukan order_id)
    await prisma.order.update({
      where: { id: order.id },
      data: { 
        final_transaction_id: responseData.transaction_id,
        // Jangan update final_status ke 'PENDING' di sini, biarkan untuk notifikasi Midtrans
        // final_status: 'PENDING',
      },
    });

    return new Response(
      JSON.stringify({ message: 'Pembayaran pelunasan dibuat.', redirect_url: redirectUrl }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating final payment:', error);
    return new Response(
      JSON.stringify({ message: 'Gagal membuat pembayaran.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await prisma.$disconnect();
  }
}
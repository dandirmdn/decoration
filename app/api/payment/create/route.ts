// app/api/payment/create/route.ts

import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';
import { Buffer } from 'buffer';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { orderId, userId, totalAmount, dpAmount } = await req.json(); // Terima orderId

    // Ambil token dari cookie
    const token = req.cookies.get('auth-token')?.value;

    if (!token) {
      return new Response(
        JSON.stringify({ message: 'Token tidak ditemukan.' }),
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

    // ✅ Gunakan order.id + '_dp' sebagai order_id Midtrans untuk DP
    const midtransOrderId = `${order.id}_dp`;

    // Payload untuk Midtrans (hanya DP)
    const payload = {
      transaction_details: {
        order_id: midtransOrderId, // ✅ Gunakan ID unik untuk DP
        gross_amount: dpAmount, // Bayar DP saja
      },
      item_details: [
        {
          id: order.package_id,
          price: dpAmount,
          quantity: 1,
          name: `${order.package.name} - DP`,
        },
      ],
      customer_details: {
        email: decoded.email,
        first_name: decoded.name || 'Customer', // Gunakan nama dari token jika ada
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

    // ✅ Update order dengan transactionId DP (ini adalah transaction_id dari Midtrans, bukan order_id)
    await prisma.order.update({
      where: { id: order.id },
      data: { dp_transaction_id: responseData.transaction_id },
    });

    return new Response(
      JSON.stringify({ message: 'Pembayaran DP dibuat.', redirect_url: redirectUrl }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating payment:', error);
    return new Response(
      JSON.stringify({ message: 'Gagal membuat pembayaran.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await prisma.$disconnect();
  }
}
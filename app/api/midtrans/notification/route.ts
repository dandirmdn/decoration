// app/api/midtrans/notification/route.ts

import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Interface untuk payload notifikasi Midtrans (sesuai contoh)
interface MidtransNotificationPayload {
  transaction_time: string;
  transaction_status: string; // Misalnya: settlement, capture, pending, cancel, expire, failure
  transaction_id: string;
  status_code: string;
  status_message: string;
  signature_key: string;
  order_id: string; // ID order Anda (dari Midtrans)
  merchant_id: string;
  gross_amount: string; // dalam format "10000.00"
  fraud_status: string; // accept, deny, challenge
  payment_type: string; // Misalnya: credit_card, bank_transfer, etc.
  // Tambahkan field lain sesuai kebutuhan, seperti:
  // masked_card, bank, approval_code, dll.
}

export async function POST(req: NextRequest) {
  let event: MidtransNotificationPayload;

  try {
    event = await req.json();
  } catch (error) {
    console.error('Error parsing Midtrans notification:', error);
    return new Response(
      JSON.stringify({ message: 'Invalid JSON' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { order_id, transaction_status, fraud_status, transaction_id, gross_amount, payment_type } = event;

  console.log('Midtrans notification received:', event); // Log untuk debugging

  // ✅ Identifikasi apakah ini DP atau Pelunasan berdasarkan akhiran order_id
  // Misalnya: 'cmi0oxpmd0001qy3itcsay3p6_dp' atau 'cmi0oxpmd0001qy3itcsay3p6_final'
  const isDpNotification = order_id.endsWith('_dp');
  const isFinalNotification = order_id.endsWith('_final');

  if (!isDpNotification && !isFinalNotification) {
    console.error('Order ID tidak mengandung akhiran _dp atau _final:', order_id);
    return new Response(
      JSON.stringify({ message: 'Order ID tidak valid.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Ambil ID order asli (tanpa akhiran)
  const originalOrderId = isDpNotification ? order_id.slice(0, -3) : order_id.slice(0, -6);

  // Cari order berdasarkan originalOrderId (id dari tabel Order)
  let order = await prisma.order.findUnique({
    where: { id: originalOrderId },
  });

  if (!order) {
    console.error('Order not found for notification:', originalOrderId);
    return new Response(
      JSON.stringify({ message: 'Order not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Buat objek data yang ingin di-update
  let updateData: any = {
    transactionStatus: transaction_status, // Simpan status transaksi umum
    fraud_status: fraud_status, // Jika Anda ingin menyimpan fraud status
    payment_type: payment_type, // Jika Anda ingin menyimpan metode pembayaran
  };

  // Konversi gross_amount dari string ke number untuk perbandingan
  const amount = parseFloat(gross_amount);

  // Logika update status berdasarkan transaction_status dari Midtrans dan apakah ini DP atau Final
  if (transaction_status === 'settlement' || transaction_status === 'capture') {
    if (isDpNotification) { // Pembayaran DP berhasil
      updateData.dp_status = 'PAID';
      if (order.status === 'PENDING') {
        updateData.status = 'DP_PAID';
      }
      updateData.dp_paid_at = new Date();
      // Jangan update dp_transaction_id di sini karena sudah diset di API pembuatan pembayaran DP
      // updateData.dp_transaction_id = transaction_id;
    } else if (isFinalNotification) { // Pembayaran Pelunasan berhasil
      updateData.final_status = 'PAID';
      if (order.status === 'DP_PAID' || order.status === 'IN_PROGRESS') {
        updateData.status = 'FINISHED'; // Atau 'COMPLETED', sesuaikan logika Anda
      }
      updateData.final_paid_at = new Date();
      // Jangan update final_transaction_id di sini karena sudah diset di API pembuatan pembayaran pelunasan
      // updateData.final_transaction_id = transaction_id;
    }
  } else if (transaction_status === 'cancel' || transaction_status === 'expire' || transaction_status === 'failure') {
    // Pembayaran gagal/dibatalkan
    if (isDpNotification) { // DP gagal
      updateData.dp_status = 'FAILED';
      updateData.status = 'CANCELLED';
    } else if (isFinalNotification) { // Pelunasan gagal
      updateData.final_status = 'FAILED';
      // Misalnya, jika pelunasan gagal, status tetap di IN_PROGRESS atau COMPLETED, atau dibuat status baru
      // updateData.status = 'COMPLETED'; // Atau biarkan status tetap
    }
  } else if (transaction_status === 'pending') {
    // Pembayaran pending
    if (isDpNotification) {
      updateData.dp_status = 'PENDING';
    } else if (isFinalNotification) {
      updateData.final_status = 'PENDING';
    }
  }

  try {
    order = await prisma.order.update({
      where: { id: originalOrderId }, // Gunakan originalOrderId
       data: updateData,
    });

    console.log('Order updated successfully for notification:', originalOrderId, 'Status:', transaction_status);

    // Balas dengan 200 OK agar Midtrans tidak mengirim ulang notifikasi
    return new Response(
      JSON.stringify({ message: 'Notification received', originalOrderId, transaction_status }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating order from notification:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to update order' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await prisma.$disconnect();
  }
}
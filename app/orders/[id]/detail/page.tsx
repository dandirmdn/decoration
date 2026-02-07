// app/orders/[id]/page.tsx

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { PrismaClient } from '@prisma/client';
import { Package, PackageX, Calendar, MapPin, CreditCard, CheckCircle, Clock, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const prisma = new PrismaClient();

// Interface untuk data order
interface Order {
  id: string;
  user_id: string;
  package_id: string;
  total_amount: number;
  status: string;
  dp_amount: number;
  dp_paid_at?: Date | null;
  dp_transaction_id?: string | null;
  dp_status: string;
  final_amount: number;
  final_paid_at?: Date | null;
  final_transaction_id?: string | null;
  final_status: string;
  created_at: Date;
  updated_at: Date;
  transactionStatus?: string;
  fraud_status?: string;
  payment_type?: string;

  // Data Customer
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  schedule_date: Date | string;

  // Relasi
  package: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    package_items: {
      id: string;
      name: string;
      price: number;
    }[];
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

async function getOrderDetails(orderId: string, userId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      package: {
        include: {
          package_items: true,
        },
      },
      user: true, // Jika ingin menampilkan nama user (opsional di detail pesanan)
    },
  });

  if (!order) {
    return null; // Pesanan tidak ditemukan
  }

  // Pastikan pesanan milik user yang sedang login
  if (order.user_id !== userId) {
    return null; // Akses ditolak
  }

  return order;
}

async function checkAuthAndGetUser() {
  const cookieStore = cookies();
  const token = (await cookieStore).get('auth-token');

  if (!token) {
    return null; // Tidak login
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');
    const decoded = await jwtVerify(token.value, secret);

    // Cari user untuk validasi role jika diperlukan di masa mendatang
    const user = await prisma.user.findUnique({
      where: { id: decoded.payload.sub as string },
    });

    if (!user) {
      return null; // User tidak ditemukan
    }

    return { id: user.id, name: user.name, email: user.email, role: user.role };
  } catch (error) {
    console.error('Auth check failed:', error);
    return null; // Token tidak valid
  }
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params; // Gunakan await karena params sekarang Promise di Next 15

  const loggedUser = await checkAuthAndGetUser();

  if (!loggedUser) {
    // Jika tidak login, redirect ke login (kita render pesan error di sini sebagai gantinya)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-white p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mt-4">Akses Ditolak</h2>
          <p className="text-gray-600 mt-2">Anda harus login terlebih dahulu untuk melihat halaman ini.</p>
          <Link href="/auth/login" className="mt-6 inline-block bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 px-6 rounded-full shadow-md transition">
            Ke Halaman Login
          </Link>
        </div>
      </div>
    );
  }

  const order = await getOrderDetails(orderId, loggedUser.id);

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-white p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <PackageX className="w-8 h-8 text-gray-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mt-4">Pesanan Tidak Ditemukan</h2>
          <p className="text-gray-600 mt-2">Pesanan dengan ID tersebut tidak ditemukan atau Anda tidak memiliki akses.</p>
          <Link href="/orders" className="mt-6 inline-block bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 px-6 rounded-full shadow-md transition">
            Kembali ke Daftar Pesanan
          </Link>
        </div>
      </div>
    );
  }

  // Fungsi untuk mendapatkan status badge
  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'FINISHED':
        return { text: 'Selesai', icon: CheckCircle, color: 'bg-green-100 text-green-800' };
      case 'COMPLETED':
        return { text: 'Lunas', icon: CheckCircle, color: 'bg-blue-100 text-blue-800' };
      case 'IN_PROGRESS':
        return { text: 'Diproses', icon: Clock, color: 'bg-yellow-100 text-yellow-800' };
      case 'DP_PAID':
        return { text: 'DP Dibayar', icon: CheckCircle, color: 'bg-purple-100 text-purple-800' };
      case 'CANCELLED':
        return { text: 'Dibatalkan', icon: XCircle, color: 'bg-red-100 text-red-800' };
      default:
        return { text: 'Pending', icon: Clock, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const statusInfo = getStatusBadge(order.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link
            href="/orders"
            className="flex items-center text-gray-600 hover:text-pink-600 font-medium transition"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Kembali ke Daftar Pesanan
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          {/* Header Detail */}
          <div className="bg-gradient-to-r from-pink-500 to-pink-600 p-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold">Detail Pesanan</h1>
                <p className="opacity-90">ID: {order.id}</p>
              </div>
              <span className={`flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                <StatusIcon className="w-4 h-4 mr-1" />
                {statusInfo.text}
              </span>
            </div>
          </div>

          <div className="p-6">
            {/* Informasi Paket */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Package className="w-6 h-6 text-pink-600" />
                {order.package.name}
              </h2>
              <p className="text-gray-600 mt-1">{order.package.description || 'Deskripsi paket tidak tersedia.'}</p>
            </div>

            {/* Ringkasan Pembayaran */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="font-bold text-gray-700 mb-3">Ringkasan Pembayaran</h3>
              <div className="space-y-2 text-gray-500">
                <div className="flex justify-between">
                  <span>Total Paket</span>
                  <span className="font-semibold">Rp {order.total_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>DP (30%)</span>
                  <span className={`font-medium ${
                    order.dp_status === 'PAID' ? 'text-green-600' : 
                    order.dp_status === 'FAILED' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    Rp {order.dp_amount.toLocaleString()} ({order.dp_status})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Pelunasan (70%)</span>
                  <span className={`font-medium ${
                    order.final_status === 'PAID' ? 'text-green-600' : 
                    order.final_status === 'FAILED' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    Rp {order.final_amount.toLocaleString()} ({order.final_status})
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total Dibayar</span>
                    <span>
                      Rp {(order.dp_status === 'PAID' ? order.dp_amount : 0 + order.final_status === 'PAID' ? order.final_amount : 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detail Jadwal & Customer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="font-bold text-gray-700 mb-3">Informasi Jadwal</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-pink-500 mr-2" />
                    <div>
                      <p className="text-gray-600">Tanggal Acara</p>
                      <strong className="text-gray-900">{new Date(order.schedule_date!).toLocaleDateString('id-ID')}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-700 mb-3">Informasi Pelanggan</h3>
                <div className="space-y-2 text-sm text-gray-500">
                  <div>
                    <p className="text-gray-600">Nama</p>
                    <p className="font-medium">{order.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Email</p>
                    <p className="font-medium">{order.customer_email}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Telepon</p>
                    <p className="font-medium">{order.customer_phone}</p>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="w-4 h-4 text-pink-500 mr-2 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-gray-600">Alamat</p>
                      <p className="font-medium">{order.customer_address}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detail Item Paket */}
            <div className="mb-8">
              <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Item dalam Paket:
              </h3>
              <ul className="bg-gray-50 rounded-xl p-4">
                {order.package.package_items.map((item) => (
                  <li key={item.id} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-700">{item.name}</span>
                    <span className="text-gray-500"></span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Detail Pembayaran */}
            <div className="mb-8">
              <h3 className="font-bold text-gray-700 mb-3">Detail Pembayaran</h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-blue-800">Pembayaran DP</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      order.dp_status === 'PAID' ? 'bg-green-100 text-green-800' :
                      order.dp_status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.dp_status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">ID Transaksi: {order.dp_transaction_id || '-'}</p>
                  <p className="text-sm text-gray-600">Tanggal Bayar: {order.dp_paid_at ? new Date(order.dp_paid_at).toLocaleString('id-ID') : '-'}</p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-green-800">Pembayaran Pelunasan</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      order.final_status === 'PAID' ? 'bg-green-100 text-green-800' :
                      order.final_status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.final_status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">ID Transaksi: {order.dp_transaction_id || '-'}</p>
                  <p className="text-sm text-gray-600">Tanggal Bayar: {order.final_paid_at ? new Date(order.final_paid_at).toLocaleString('id-ID') : '-'}</p>
                </div>
              </div>
            </div>

            {/* Aksi */}
            <div className="flex justify-end space-x-4">
              {/* Tombol cetak faktur jika diperlukan */}
              {/* <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-medium transition">
                Cetak Faktur
              </button> */}
              <Link
                href="/orders"
                className="bg-pink-600 hover:bg-pink-700 text-white py-2 px-6 rounded-lg font-medium transition"
              >
                Kembali ke Daftar
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          Pesanan ini dibuat pada {new Date(order.created_at).toLocaleString('id-ID')}.
        </div>
      </div>
    </div>
  );
}
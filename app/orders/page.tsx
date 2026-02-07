// app/orders/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Order as OrderType } from '@prisma/client';
import { Package, PackageX, Calendar, CreditCard, CheckCircle, Clock, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Order extends Omit<OrderType, 'package'> {
  package: {
    id: string;
    name: string;
  };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders', {
          credentials: 'include',
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Gagal mengambil pesanan');
        }
        const data = await res.json();
        setOrders(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-white p-4">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-pink-500 animate-spin" />
          <p className="mt-4 text-gray-600">Memuat pesanan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-white p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mt-4">Terjadi Kesalahan</h2>
          <p className="text-gray-600 mt-2">{error}</p>
          <Link href="/auth/login" className="mt-6 inline-block bg-pink-600 text-white py-2 px-6 rounded-full shadow-md hover:bg-pink-700 transition">
            Kembali ke Login
          </Link>
        </div>
      </div>
    );
  }

  // Fungsi untuk mendapatkan status badge
  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'FINISHED':
        return { text: 'Selesai', icon: CheckCircle, color: 'bg-green-100 text-green-800', border: 'border-green-200' };
      case 'COMPLETED':
        return { text: 'Lunas', icon: CheckCircle, color: 'bg-blue-100 text-blue-800', border: 'border-blue-200' };
      case 'IN_PROGRESS':
        return { text: 'Diproses', icon: Clock, color: 'bg-yellow-100 text-yellow-800', border: 'border-yellow-200' };
      case 'DP_PAID':
        return { text: 'DP Dibayar', icon: CheckCircle, color: 'bg-purple-100 text-purple-800', border: 'border-purple-200' };
      case 'CANCELLED':
        return { text: 'Dibatalkan', icon: XCircle, color: 'bg-red-100 text-red-800', border: 'border-red-200' };
      default:
        return { text: 'Pending', icon: Clock, color: 'bg-gray-100 text-gray-800', border: 'border-gray-200' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white p-4">
      <div className="max-w-6xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Daftar Pesanan Saya</h1>
          <p className="text-gray-600 mt-2">Kelola dan lacak status pesanan dekorasi pernikahan Anda.</p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-pink-100 rounded-full flex items-center justify-center mx-auto">
              <PackageX className="w-12 h-12 text-pink-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mt-6">Belum Ada Pesanan</h2>
            <p className="text-gray-600 mt-2">Anda belum memiliki pesanan apapun.</p>
            <Link href="/" className="mt-6 inline-block bg-pink-600 hover:bg-pink-700 text-white font-medium py-3 px-8 rounded-full shadow-lg transition transform hover:scale-105">
              Pilih Paket Sekarang
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"> {/* Tambahkan gap lebih besar */}
            {orders.map((order) => {
      const statusInfo = getStatusBadge(order.status);
      const StatusIcon = statusInfo.icon;
      const isFinalPaid = order.final_status === 'PAID';
      const isDpPaid = order.dp_status === 'PAID';

      return (
        <div
          key={order.id}
          className={`bg-white rounded-2xl shadow-lg overflow-hidden border ${statusInfo.border} hover:shadow-xl transition-all duration-300`}
        >
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{order.package.name}</h2>
                <p className="text-gray-600 text-sm mt-1">ID: {order.id.substring(0, 8)}...</p>
              </div>
              <span className={`flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                <StatusIcon className="w-4 h-4 mr-1" />
                {statusInfo.text}
              </span>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total</span>
                <span className="font-semibold text-gray-800">Rp {order.total_amount.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">DP</span>
                <span className={`font-medium ${
                  order.dp_status === 'PAID' ? 'text-green-600' : 
                  order.dp_status === 'FAILED' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {order.dp_status}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Pelunasan</span>
                <span className={`font-medium ${
                  order.final_status === 'PAID' ? 'text-green-600' : 
                  order.final_status === 'FAILED' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {order.final_status}
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-col space-y-3">
              <div className="text-xs text-gray-500 flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Dipesan: {new Date(order.created_at).toLocaleDateString('id-ID')}
              </div>
              
              <div className="flex space-x-3">
                {/* Tombol Pelunasan */}
                {!isFinalPaid && isDpPaid && (
                  <Link
                    href={`/orders/${order.id}/payment`}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium text-center transition"
                  >
                    Lunasi Sekarang
                  </Link>
                )}
                
                <Link
                  href={`/orders/${order.id}/detail`}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg text-sm font-medium text-center transition"
                >
                  Detail
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    })}
          </div>
        )}
      </div>
    </div>
  );
}
// app/payment/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Order as OrderType } from '@prisma/client';
import { ArrowLeft, CreditCard, CheckCircle, Package as PackageIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';

// Interface untuk menyimpan data order
interface OrderWithPackage extends Omit<OrderType, 'package'> {
  package: {
    id: string;
    name: string;
    package_items: {
      id: string;
      name: string;
      price: number;
    }[];
  };
}

// Interface untuk data user dari API
interface UserResponse {
  isLoggedIn: boolean;
  user?: {
    id: string;
    email: string;
  };
}

export default function PaymentPage() {
  const [order, setOrder] = useState<OrderWithPackage | null>(null);
  const [user, setUser] = useState<UserResponse['user'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Ambil status login dari server (menggunakan cookie)
    const fetchAuthStatus = async () => {
      try {
        const res = await fetch('/api/auth/status', {
          credentials: 'include',
        });
        const data = await res.json();

        if (!data.isLoggedIn) {
          router.push('/auth/login');
          return;
        }

        setUser(data.user);
      } catch (err) {
        console.error('Error fetching auth status:', err);
        router.push('/auth/login');
      }
    };

    fetchAuthStatus();

    // Ambil orderId dari localStorage
    const orderId = localStorage.getItem('currentOrderId');
    if (!orderId) {
      setError('ID pesanan tidak ditemukan. Silakan pilih paket terlebih dahulu.');
      setLoading(false);
      return;
    }

    // Ambil detail order dari API menggunakan ID
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`, {
          credentials: 'include',
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Gagal mengambil detail pesanan');
        }

        const data = await res.json();
        setOrder(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-white p-4">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-pink-500 animate-spin" />
          <p className="mt-4 text-gray-600">Memuat detail pembayaran...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-white p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <CreditCard className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mt-4">Terjadi Kesalahan</h2>
          <p className="text-gray-600 mt-2">{error}</p>
          <Link
            href="/"
            className="mt-6 inline-block bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 px-6 rounded-full shadow-md transition"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 to-white p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <PackageIcon className="w-8 h-8 text-gray-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mt-4">Pesanan Tidak Ditemukan</h2>
          <p className="text-gray-600 mt-2">Silakan pilih paket dari halaman utama.</p>
          <Link
            href="/"
            className="mt-6 inline-block bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 px-6 rounded-full shadow-md transition"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  // Gunakan kembali logika DP
  const dpAmount = order.dp_amount;
  const remainingAmount = order.final_amount;

  const handlePayNow = async () => {
    if (!order || !user) return;

    setIsProcessing(true);

    try {
      // Kirim dpAmount (30%)
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id, // Kirim orderId, bukan packageId
          userId: user.id,
          totalAmount: order.total_amount,
          dpAmount, // Kirim DP amount
        }),
        credentials: 'include',
      });

      const data = await res.json();

      if (res.ok) {
        window.location.href = data.redirect_url;
      } else {
        alert(data.message || 'Gagal membuat pembayaran');
      }
    } catch (err) {
      alert('Terjadi kesalahan saat memproses pembayaran.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-pink-600 font-medium transition"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Kembali
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          {/* Header Pembayaran */}
          <div className="bg-gradient-to-r from-pink-500 to-pink-600 p-6 text-white">
            <h1 className="text-2xl font-bold">Pembayaran DP</h1>
            <p className="opacity-90">Lakukan pembayaran DP sebesar 30% untuk mengunci paket Anda.</p>
          </div>

          <div className="p-6">
            {/* Detail Paket */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <PackageIcon className="w-6 h-6 text-pink-600" />
                {order.package.name}
              </h2>
              <p className="text-gray-600 mt-1">Total Paket: <span className="font-semibold text-lg">Rp {order.total_amount.toLocaleString()}</span></p>
            </div>

            {/* Ringkasan Pembayaran */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="font-bold text-gray-700 mb-3">Ringkasan Pembayaran</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>DP (30%)</span>
                  <span className="font-semibold text-pink-600">Rp {dpAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Sisa Pembayaran (70%)</span>
                  <span>Rp {remainingAmount.toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total DP</span>
                    <span>Rp {dpAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detail Item */}
            <div className="mb-8">
              <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Termasuk dalam Paket:
              </h3>
              <ul className="bg-gray-50 rounded-xl p-4 max-h-60 overflow-y-auto">
                {order.package.package_items.map((item) => (
                  <li key={item.id} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-700">{item.name}</span>
                    <span className="text-gray-500">Rp {item.price?.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tombol Pembayaran */}
            <div className="mt-8">
              <button
                onClick={handlePayNow}
                disabled={isProcessing}
                className={`w-full py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition ${
                  isProcessing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Bayar DP Sekarang
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          Pembayaran dilakukan melalui Midtrans. Setelah DP dibayar, paket akan dikunci.
        </div>
      </div>
    </div>
  );
}
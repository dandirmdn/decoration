// app/orders/[id]/payment/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

export default function FinalPaymentPage() {
  const [order, setOrder] = useState<OrderWithPackage | null>(null);
  const [user, setUser] = useState<UserResponse['user'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const orderId = params.id;

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

    // Ambil detail order dari API menggunakan ID dari URL params
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
  }, [router, orderId]);

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
            href="/orders"
            className="mt-6 inline-block bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 px-6 rounded-full shadow-md transition"
          >
            Kembali ke Pesanan
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
          <p className="text-gray-600 mt-2">Silakan cek daftar pesanan Anda.</p>
          <Link
            href="/orders"
            className="mt-6 inline-block bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 px-6 rounded-full shadow-md transition"
          >
            Kembali ke Pesanan
          </Link>
        </div>
      </div>
    );
  }

  // Pastikan pelunasan belum dibayar
  if (order.final_status === 'PAID') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 to-white p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mt-4">Pelunasan Sudah Dibayar</h2>
          <p className="text-gray-600 mt-2">Terima kasih, pelunasan untuk pesanan ini sudah diselesaikan.</p>
          <Link
            href={`/orders/${order.id}`}
            className="mt-6 inline-block bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 px-6 rounded-full shadow-md transition"
          >
            Lihat Detail Pesanan
          </Link>
        </div>
      </div>
    );
  }

  // Pastikan DP sudah dibayar sebelum bisa bayar pelunasan
  if (order.dp_status !== 'PAID') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 to-white p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
            <CreditCard className="w-8 h-8 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mt-4">DP Belum Dibayar</h2>
          <p className="text-gray-600 mt-2">Anda harus membayar DP terlebih dahulu sebelum melunasi.</p>
          <Link
            href={`/payment`} // Asumsikan halaman DP lama masih bisa digunakan jika order belum dibayar
            className="mt-6 inline-block bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 px-6 rounded-full shadow-md transition"
          >
            Bayar DP Sekarang
          </Link>
        </div>
      </div>
    );
  }

  const finalAmount = order.final_amount;

  const handlePayNow = async () => {
    if (!order || !user) return;

    setIsProcessing(true);

    try {
      const res = await fetch('/api/payment/final', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          userId: user.id,
          totalAmount: order.total_amount,
          finalAmount,
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-blue-600 font-medium transition"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Kembali
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          {/* Header Pembayaran */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
            <h1 className="text-2xl font-bold">Pembayaran Pelunasan</h1>
            <p className="opacity-90">Lakukan pembayaran pelunasan untuk menyelesaikan pesanan Anda.</p>
          </div>

          <div className="p-6">
            {/* Ringkasan Pembayaran */}
            <div className="mb-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <PackageIcon className="w-6 h-6 text-blue-600" />
                {order.package.name}
              </h2>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">Total Paket</p>
                  <p className="text-lg font-semibold">Rp {order.total_amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Sisa Pembayaran (70%)</p>
                  <p className="text-lg font-semibold text-blue-600">Rp {finalAmount.toLocaleString()}</p>
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
                  <li key={item.id} className="flex justify-between py-2 border-b border-gray-100 last:border-0 last:pb-0 first:pt-0">
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
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
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
                    Bayar Pelunasan Rp {finalAmount.toLocaleString()}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          Pembayaran dilakukan melalui Midtrans. Setelah pelunasan dibayar, pesanan akan selesai.
        </div>
      </div>
    </div>
  );
}
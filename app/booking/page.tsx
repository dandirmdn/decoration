// app/booking/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package as PackageType, PackageItem as PackageItemType } from '@prisma/client';
import { ArrowLeft, User, Mail, Phone, MapPin, CreditCard, Package as PackageIcon, Loader2, XCircle } from 'lucide-react';
import Link from 'next/link';
import DatePicker from 'react-datepicker';

// Interface untuk menyimpan paket yang dipilih
interface PackageWithItems extends Omit<PackageType, 'package_items'> {
  package_items: PackageItemType[];
}

// Interface untuk data user dari API
interface UserResponse {
  isLoggedIn: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface ScheduleResponse {
  bookedDates: string[]; // Format: "YYYY-MM-DD"
}

export default function BookingPage() {
  const [pkg, setPkg] = useState<PackageWithItems | null>(null);
  const [user, setUser] = useState<UserResponse['user'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null); // Ganti ke Date object

  // State untuk tanggal-tanggal yang dipesan
  const [bookedDates, setBookedDates] = useState<Date[]>([]);

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

    // Ambil paket dari localStorage
    const selectedPackage = localStorage.getItem('selectedPackage');
    if (selectedPackage) {
      setPkg(JSON.parse(selectedPackage));
    } else {
      setError('Paket tidak ditemukan. Silakan pilih paket terlebih dahulu.');
    }

    // Ambil daftar tanggal yang sudah dipesan
    const fetchBookedDates = async () => {
      try {
        const res = await fetch('/api/schedules/list', {
          credentials: 'include',
        });
        const data: ScheduleResponse = await res.json();

        if (!res.ok) {
          console.error('Gagal mengambil jadwal:', data);
          // Tetap lanjutkan, mungkin tidak fatal untuk menampilkan form
        } else {
          // Konversi string ke Date object
          const dates = data.bookedDates.map(dateStr => new Date(dateStr));
          setBookedDates(dates);
        }
      } catch (err) {
        console.error('Error fetching booked dates:', err);
        // Tetap lanjutkan, mungkin tidak fatal untuk menampilkan form
      } finally {
        setLoading(false); // Pastikan loading selesai setelah semua data diambil
      }
    };

    fetchBookedDates();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-white p-4">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-pink-500 animate-spin" />
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-white p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <PackageIcon className="w-8 h-8 text-red-500" />
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

  if (!pkg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 to-white p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <PackageIcon className="w-8 h-8 text-gray-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mt-4">Paket Tidak Ditemukan</h2>
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!scheduleDate) {
      setError('Silakan pilih tanggal jadwal.');
      setIsSubmitting(false);
      return;
    }

    // Validasi apakah tanggal sudah di-book oleh orang lain
    // Kita tetap lakukan validasi server-side sebagai langkah aman
    try {
      const res = await fetch('/api/schedules/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: scheduleDate.toISOString() }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Gagal memeriksa jadwal.');
        setIsSubmitting(false);
        return;
      }

      if (data.isBooked) {
        setError('Tanggal yang dipilih sudah dipesan oleh orang lain. Silakan pilih tanggal lain.');
        setIsSubmitting(false);
        return;
      }

      // Jika tidak bentrok, simpan ke database dan redirect ke pembayaran
      const orderData = {
        packageId: pkg.id,
        userId: user!.id,
        totalAmount: pkg.price,
        customerName,
        customerEmail,
        customerPhone,
        customerAddress,
        scheduleDate: scheduleDate.toISOString(), // Simpan sebagai ISO string
      };

      const orderRes = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
        credentials: 'include',
      });

      const orderDataResponse = await orderRes.json();

      if (!orderRes.ok) {
        setError(orderDataResponse.message || 'Gagal membuat pesanan.');
        setIsSubmitting(false);
        return;
      }

      // Simpan orderId ke localStorage untuk digunakan di halaman pembayaran
      localStorage.setItem('currentOrderId', orderDataResponse.orderId);

      // Redirect ke halaman pembayaran
      router.push('/payment');

    } catch (err) {
      setError('Terjadi kesalahan saat memproses pesanan.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fungsi untuk mengecek apakah tanggal tertentu adalah booked
  const isBookedDate = (date: Date) => {
    return bookedDates.some(bookedDate =>
      bookedDate.getDate() === date.getDate() &&
      bookedDate.getMonth() === date.getMonth() &&
      bookedDate.getFullYear() === date.getFullYear()
    );
  };

  // Fungsi untuk mengecek apakah tanggal bisa dipilih
  const filterDate = (date: Date) => {
    return !isBookedDate(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white p-4 sm:p-6">
      <div className="max-w-4xl mx-auto py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center mb-6 sm:mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-pink-600 font-medium transition text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Kembali
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          {/* Header Pembayaran */}
          <div className="bg-gradient-to-r from-pink-500 to-pink-600 p-5 sm:p-6 text-white">
            <h1 className="text-xl sm:text-2xl font-bold">Formulir Pemesanan</h1>
            <p className="opacity-90 text-sm sm:text-base">Lengkapi data pelanggan dan jadwal acara Anda.</p>
          </div>

          <div className="p-5 sm:p-6">
            {/* Detail Paket */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                <PackageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600" />
                {pkg.name}
              </h2>
              <p className="text-gray-600 mt-2 sm:mt-3 text-sm sm:text-base">Total Paket: <span className="font-semibold text-pink-600">Rp {pkg.price.toLocaleString()}</span></p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 text-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                      placeholder="Nama lengkap"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full pl-10 pr-3 text-gray-500 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Telepon</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full pl-10 pr-3 py-3  text-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Jadwal Acara</label>
                  <div className="relative">
                    {/* <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div> */}
                    {/* Ganti input dengan DatePicker */}
                    <DatePicker
                      selected={scheduleDate}
                      onChange={(date) => setScheduleDate(date)}
                      filterDate={filterDate}
                      dateFormat="dd/MM/yyyy"
                      placeholderText="Pilih tanggal..."
                      className="w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                      wrapperClassName="w-full"
                      minDate={new Date()}
                      inline

                      // 🔥 Tambahkan custom isi tanggal
                      renderDayContents={(day, date) => {
                        const isBooked = bookedDates.some(
                          (d) =>
                            d.getDate() === date.getDate() &&
                            d.getMonth() === date.getMonth() &&
                            d.getFullYear() === date.getFullYear()
                        );

                        return (
                          <div className="relative flex items-center justify-center">
                            <span>{day}</span>

                            {isBooked && (
                              <span className="absolute text-red-600 font-bold text-lg pointer-events-none">
                                X
                              </span>
                            )}
                          </div>
                        );
                      }}
                    />

                  </div>
                </div>
              </div>

              {/* Alamat Lengkap */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Alamat Lengkap</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 pt-3 flex items-start pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full text-gray-500 pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                    placeholder="Alamat lengkap untuk pengiriman dan setup dekorasi"
                    rows={3}
                    required
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <XCircle className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="mt-8">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 px-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition ${isSubmitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white'
                    }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      <span>Lanjut ke Pembayaran</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-600">
          Pastikan data yang Anda isi valid. Tanggal jadwal tidak bisa diubah setelah pembayaran DP.
        </div>
      </div>
    </div>
  );
}
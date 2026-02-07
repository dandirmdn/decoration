// app/admin/page.tsx

// Server Component
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { PrismaClient } from '@prisma/client';
import {
  Package,
  Users,
  CreditCard,
  ShoppingCart,
  BarChart3,
  Activity,
  Calendar,
  UserCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import Link from 'next/link';

const prisma = new PrismaClient();

// Fungsi untuk memeriksa akses admin
async function checkAdminAccess() {
  const cookieStore = cookies();
  const token = (await cookieStore).get('auth-token');

  if (!token) {
    throw new Error('Akses ditolak. Silakan login.');
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');
    const decoded = await jwtVerify(token.value, secret);

    const user = await prisma.user.findUnique({
      where: { id: decoded.payload.sub as string },
    });

    if (!user || user.role !== 'ADMIN') {
      throw new Error('Akses ditolak. Hanya admin yang bisa mengakses.');
    }

    return user;
  } catch (error) {
    console.error('Admin access check failed:', error);
    throw new Error('Akses ditolak atau sesi habis.');
  }
}

// Fungsi untuk mengambil data statistik
async function getAdminStats() {
  const totalOrders = await prisma.order.count();
  const totalUsers = await prisma.user.count({where: {role: {not: "ADMIN"}}});
  const totalPackages = await prisma.package.count();

  // Contoh: Hitung pendapatan dari DP dan Pelunasan yang dibayar
  const paidOrders = await prisma.order.findMany({
    where: {
      OR: [
        { dp_status: 'PAID' },
        { final_status: 'PAID' },
      ],
    },
    select: {
      dp_amount: true,
      final_amount: true,
    },
  });

  const totalRevenue = paidOrders.reduce((sum, order) => {
    return sum + (order.dp_amount || 0) + (order.final_amount || 0);
  }, 0);

  return {
    totalOrders,
    totalUsers,
    totalPackages,
    totalRevenue,
  };
}

// ...
// Fungsi untuk mengambil aktivitas terbaru (pembayaran DP)
async function getRecentActivities(limit: number = 5) {
  const recentPayments = await prisma.order.findMany({
    where: {
      dp_status: 'PAID',
    },
    // Hapus 'include', gunakan 'select' secara menyeluruh
    select: {
      id: true,
      // Pilih field dari relasi 'user'
      user: {
        select: {
          name: true,
        },
      },
      // Pilih field dari relasi 'package'
      package: {
        select: {
          name: true,
        },
      },
      // Field lain dari order
      customer_address: true,
      schedule_date: true,
      dp_paid_at: true,
    },
    orderBy: { dp_paid_at: 'desc' },
    take: limit,
  });

  // Mapping tetap sama karena struktur hasilnya tidak berubah
  return recentPayments.map(order => ({
    id: order.id,
    customerName: order.user.name, // ✅ Akses nama user dari hasil select
    packageName: order.package.name, // ✅ Akses nama paket dari hasil select
    customerAddress: order.customer_address,
    scheduleDate: order.schedule_date,
    dpPaidAt: order.dp_paid_at,
  }));
}
// ...
export default async function AdminDashboard() {
  let adminUser, stats, recentActivities;

  try {
    adminUser = await checkAdminAccess();
    stats = await getAdminStats();
    recentActivities = await getRecentActivities(5);
  } catch (error: any) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <Activity className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Akses Ditolak</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <Link
            href="/auth/login"
            className="inline-flex items-center px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg shadow transition"
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Kembali ke Login
          </Link>
        </div>
      </div>
    );
  }

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
        <p className="text-gray-600 mt-1">Hai, <span className="font-semibold text-pink-600">{adminUser.name}</span>, ini ringkasan aktivitas terbaru.</p>
      </header>

      {/* Statistik Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Pesanan"
          value={stats.totalOrders}
          icon={<ShoppingCart className="w-6 h-6" />}
          color="bg-blue-500"
          link="/admin/orders"
        />
        <StatCard
          title="Total Pengguna"
          value={stats.totalUsers}
          icon={<Users className="w-6 h-6" />}
          color="bg-green-500"
          link="/admin/users"
        />
        <StatCard
          title="Total Paket"
          value={stats.totalPackages}
          icon={<Package className="w-6 h-6" />}
          color="bg-purple-500"
          link="/admin/packages"
        />
        <StatCard
          title="Pendapatan"
          value={formatRupiah(stats.totalRevenue)}
          icon={<CreditCard className="w-6 h-6" />}
          color="bg-yellow-500"
          link="/admin/reports"
        />
      </div>

      {/* Ringkasan Lainnya */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aktivitas Terbaru */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-pink-600" />
              Aktivitas Terbaru
            </h2>
            <Link href="/admin/orders" className="text-sm text-pink-600 hover:text-pink-800 flex items-center">
              Lihat Semua <Eye className="w-4 h-4 ml-1" />
            </Link>
          </div>
          {recentActivities.length > 0 ? (
            <ul className="space-y-3">
              {recentActivities.map((activity) => (
                <li key={activity.id} className="flex items-start text-sm">
                  <div className="bg-green-100 p-1 rounded-full mr-3 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 truncate">
                      <span className="font-medium">{activity.customerName}</span> membayar DP untuk paket <span className="font-medium">{activity.packageName}</span>.
                    </p>
                    <p className="text-gray-600 text-xs truncate">
                      Acara: {new Date(activity.scheduleDate!).toLocaleDateString('id-ID')} | Bayar: {new Date(activity.dpPaidAt!).toLocaleTimeString('id-ID')}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm italic">Tidak ada aktivitas pembayaran DP baru.</p>
          )}
        </div>

        {/* Kategori Populer / Link Cepat */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-pink-600" />
            Kelola Konten
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <QuickLink href="/admin/packages" icon={<Package className="w-5 h-5" />} label="Paket" />
            <QuickLink href="/admin/orders" icon={<ShoppingCart className="w-5 h-5" />} label="Pesanan" />
            <QuickLink href="/admin/users" icon={<Users className="w-5 h-5" />} label="Pengguna" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Komponen untuk Card Statistik
function StatCard({ title, value, icon, color, link }: { title: string; value: number | string; icon: React.ReactNode; color: string; link: string; }) {
  return (
    <Link href={link} className="block group">
      <div className="bg-white p-5 rounded-xl shadow border border-gray-100 group-hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
          <div className={`${color} p-3 rounded-lg text-white group-hover:scale-105 transition-transform duration-200`}>
            {icon}
          </div>
        </div>
      </div>
    </Link>
  );
}

// Komponen untuk Link Cepat
function QuickLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 p-4 rounded-lg transition-colors duration-200 border border-gray-200">
      <div className="text-pink-600 mb-2">
        {icon}
      </div>
      <span className="font-medium text-gray-700 text-sm">{label}</span>
    </Link>
  );
}
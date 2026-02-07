// app/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package as PackageType, PackageItem as PackageItemType } from '@prisma/client';
import { Heart, Star, Sparkles, Gift, CheckCircle } from 'lucide-react';

// Interface untuk menyimpan item di keranjang
interface PackageWithItems extends Omit<PackageType, 'package_items'> {
  package_items: PackageItemType[];
}

// Ambil data dari API route
const getPackages = async () => {
  const res = await fetch('/api/packages');
  if (!res.ok) {
    throw new Error('Gagal mengambil data paket');
  }
  return res.json() as Promise<PackageWithItems[]>;
};


export default function HomePage() {
  const [packages, setPackages] = useState<PackageWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const data = await getPackages();
        setPackages(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-600">Memuat paket...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop')",
      }}
    >

      {/* Hero Section */}
      <section className="relative z-10 py-24 text-center text-white px-4">
        <div className="max-w-4xl mx-auto">
          <Heart className="w-12 h-12 mx-auto mb-4 text-pink-300 animate-pulse" />
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
            Dekorasi Pernikahan Impian Anda
          </h1>
          <p className="text-lg md:text-xl mb-8 opacity-90">
            Pilih paket dekorasi kami yang indah dan elegan untuk hari spesial Anda.
          </p>
          <Link href="#packages">
            <button className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition hover:scale-105">
              Lihat Paket
            </button>
          </Link>
        </div>
      </section>

      {/* Packages Section */}
      <section id="packages" className="relative z-10 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12 flex items-center justify-center gap-3">
            <Star className="w-8 h-8 text-yellow-500" /> Paket Dekorasi
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-gray-800">{pkg.name}</h3>
                    <Gift className="w-8 h-8 text-pink-500" />
                  </div>
                  <p className="text-pink-600 font-semibold text-xl mb-2">
                    Rp {pkg.price.toLocaleString()}
                  </p>
                  <p className="text-gray-600 mb-4">{pkg.description || "Paket elegan untuk momen istimewa."}</p>
                  <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" /> Termasuk:
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 mb-4 max-h-40 overflow-y-auto">
                    {pkg.package_items.map((item) => (
                      <li key={item.id} className="text-gray-600">
                        {item.name} <span className="text-gray-500"></span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => {
                      // Simpan paket ke localStorage
                      localStorage.setItem('selectedPackage', JSON.stringify(pkg));
                      // Redirect ke halaman booking
                      window.location.href = '/booking';
                    }}
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded-lg transition hover:shadow-md"
                  >
                    Pilih Paket Ini
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-800 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm opacity-80">
            © {new Date().getFullYear()} Elegant Decor. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
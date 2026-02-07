// app/admin/packages/page.tsx

// Client Component
'use client';

import { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import PackagesDataFetcher from './PackagesDataFetcher';
import PackageModal from './PackageModal';

export default function AdminPackagesPage() {
  const [fetchedData, setFetchedData] = useState<Awaited<ReturnType<typeof PackagesDataFetcher>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [selectedPackage, setSelectedPackage] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await PackagesDataFetcher();
        setFetchedData(data);
        if (data.error) {
          setError(data.error);
        }
      } catch (err: any) {
        setError(err.message || 'Gagal mengambil data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleView = (pkg: any) => {
    setSelectedPackage(pkg);
    setModalMode('view');
    setModalIsOpen(true);
  };

  const handleEdit = (pkg: any) => {
    setSelectedPackage(pkg);
    setModalMode('edit');
    setModalIsOpen(true);
  };

  const handleCloseModal = () => {
    setModalIsOpen(false);
    setSelectedPackage(null);
  };

  const handleSave = (updatedPackage: any) => {
    // Perbarui data lokal setelah edit berhasil
    if (fetchedData && fetchedData.packages) {
      setFetchedData({
        ...fetchedData,
        packages: fetchedData.packages.map(p =>
          p.id === updatedPackage.id ? updatedPackage : p
        ),
      });
    }
    handleCloseModal();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-600"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <Package className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Terjadi Kesalahan</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            href="/auth/login"
            className="inline-flex items-center px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg shadow transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            Kembali ke Login
          </Link>
        </div>
      </div>
    );
  }

  if (!fetchedData || !fetchedData.packages) {
    return null; // Atau tampilkan error jika data null tapi tidak ada error message
  }

  const { packages, adminUser } = fetchedData;

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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Kelola Paket</h1>
            <p className="text-gray-600 mt-1">Lihat, tambah, edit, atau hapus paket dekorasi.</p>
          </div>
          <Link
            href="/admin/packages/new" // Link ke form tambah baru (bisa Client atau Server Component)
            className="inline-flex items-center px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg shadow transition"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Paket
          </Link>
        </div>
      </header>

      {/* Tabel Daftar Paket */}
      <div className="bg-white p-6 rounded-xl shadow border border-gray-100 overflow-x-auto">
        {packages.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Belum ada paket yang dibuat.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Paket
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Harga
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item dalam Paket
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {packages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{pkg.name}</div>
                    {pkg.description && (
                      <div className="text-sm text-gray-500">{pkg.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatRupiah(pkg.price)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <ul className="text-sm text-gray-500 max-w-xs">
                      {pkg.package_items.map((item) => (
                        <li key={item.id} className="truncate">
                          {item.name} - {formatRupiah(item.price)}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleView(pkg)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Lihat Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(pkg)}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Edit Paket"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <Link
                        href={`/admin/packages/delete/${pkg.id}`}
                        className="text-red-600 hover:text-red-900"
                        title="Hapus Paket"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      <PackageModal
        isOpen={modalIsOpen}
        onClose={handleCloseModal}
        packageData={selectedPackage}
        mode={modalMode}
        onSave={handleSave}
      />
    </div>
  );
}
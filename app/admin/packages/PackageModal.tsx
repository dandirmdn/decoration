// app/admin/packages/PackageModal.tsx

'use client';

import { useState, useEffect } from 'react';
import { Package, PackageX, X, Save, Edit3, Eye } from 'lucide-react';

interface PackageItem {
  id: string;
  name: string;
  price: number;
}

interface PackageData {
  id?: string; // Tidak ada saat create
  name: string;
  description: string | null;
  price: number;
  package_items: PackageItem[];
}

interface PackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageData: PackageData | null; // Data untuk view/edit, null jika hanya create
  mode: 'view' | 'edit'; // Mode untuk menentukan apakah form edit atau hanya display
  onSave: (updatedPackage: PackageData) => void; // Callback untuk menyimpan perubahan
}

export default function PackageModal({ isOpen, onClose, packageData, mode, onSave }: PackageModalProps) {
  const [formData, setFormData] = useState<PackageData>({
    name: '',
    description: '',
    price: 0,
    package_items: [],
  });
  const [itemInputs, setItemInputs] = useState<{ name: string; price: number }[]>([{ name: '', price: 0 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form dan error saat modal dibuka atau data berubah
  useEffect(() => {
    if (isOpen && packageData) {
      setFormData({
        id: packageData.id,
        name: packageData.name,
        description: packageData.description || '',
        price: packageData.price,
        package_items: [...packageData.package_items], // Copy array
      });
      // Set item inputs untuk edit
      if (mode === 'edit') {
        setItemInputs([...packageData.package_items.map(item => ({ name: item.name, price: item.price }))]);
      } else {
        // Jika view, reset item inputs
        setItemInputs([{ name: '', price: 0 }]);
      }
    } else if (isOpen) {
      // Jika open tapi data null (misalnya untuk create dari sini), reset ke kosong
      setFormData({
        name: '',
        description: '',
        price: 0,
        package_items: [],
      });
      setItemInputs([{ name: '', price: 0 }]);
    }
    setError(null);
  }, [isOpen, packageData, mode]);

  // Jangan render apa-apa jika modal tidak terbuka
  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index: number, field: 'name' | 'price', value: string) => {
    const newItems = [...itemInputs];
    if (field === 'price') {
      newItems[index][field] = parseFloat(value) || 0;
    } else {
      newItems[index][field] = value;
    }
    setItemInputs(newItems);
  };

  const addItem = () => {
    setItemInputs([...itemInputs, { name: '', price: 0 }]);
  };

  const removeItem = (index: number) => {
    if (itemInputs.length > 1) { // Minimal 1 item
      const newItems = [...itemInputs];
      newItems.splice(index, 1);
      setItemInputs(newItems);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validasi sederhana
    if (!formData.name.trim() || formData.price <= 0) {
      setError('Nama dan harga harus diisi dengan benar.');
      setIsSubmitting(false);
      return;
    }

    // Validasi item
    for (const item of itemInputs) {
      if (!item.name.trim() || item.price <= 0) {
        setError('Nama dan harga item harus diisi dengan benar.');
        setIsSubmitting(false);
        return;
      }
    }

    // Siapkan data untuk dikirim
    const payload = {
      ...formData,
      package_items: itemInputs,
    };

    try {
      // Kirim ke API update
      const res = await fetch('/api/admin/packages', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || 'Gagal menyimpan paket.');
      }

      // Panggil callback untuk memberi tahu parent bahwa data telah diperbarui
      onSave(result.package);
      onClose(); // Tutup modal setelah berhasil
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render isi modal berdasarkan mode
  const renderContent = () => {
    if (mode === 'view') {
      return (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Detail Paket</h3>
            <p className="text-gray-600 text-sm">ID: {packageData?.id}</p>
          </div>
          <div className="space-y-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nama Paket</label>
              <p className="mt-1 text-gray-900">{packageData?.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
              <p className="mt-1 text-gray-900">{packageData?.description || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Harga</label>
              <p className="mt-1 text-gray-900">Rp {packageData?.price.toLocaleString('id-ID')}</p>
            </div>
          </div>
          <div>
            <h4 className="text-md font-semibold text-gray-800 mb-2">Item dalam Paket</h4>
            <ul className="bg-gray-50 rounded-lg p-3 space-y-1 max-h-40 overflow-y-auto">
              {packageData?.package_items.map((item) => (
                <li key={item.id} className="flex justify-between text-sm py-1 border-b border-gray-100">
                  <span>{item.name}</span>
                  <span className="text-gray-600">Rp {item.price.toLocaleString('id-ID')}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    } else { // mode === 'edit'
      return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Edit Paket</h3>
            <p className="text-gray-600 text-sm">ID: {formData.id}</p>
          </div>
          <div className="space-y-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama Paket *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Deskripsi</label>
              <textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">Harga *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price || ''}
                onChange={handleChange}
                min="0"
                step="1000"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-md font-semibold text-gray-800">Item dalam Paket *</h4>
              <button
                type="button"
                onClick={addItem}
                className="text-xs bg-green-100 hover:bg-green-200 text-green-800 py-1 px-2 rounded-md flex items-center"
              >
                + Tambah Item
              </button>
            </div>
            <div className="space-y-2">
              {itemInputs.map((item, index) => (
                <div key={index} className="flex items-end space-x-2">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700">Nama Item *</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-xs font-medium text-gray-700">Harga *</label>
                    <input
                      type="number"
                      value={item.price || ''}
                      onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                      min="0"
                      step="1000"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={itemInputs.length <= 1}
                    className="text-xs bg-red-100 hover:bg-red-200 text-red-800 py-2 px-2 rounded-md disabled:opacity-50"
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <PackageX className="h-5 w-5 text-red-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan
                </>
              )}
            </button>
          </div>
        </form>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center rounded-t-xl">
          <div className="flex items-center">
            {mode === 'view' ? (
              <Eye className="h-5 w-5 text-blue-600 mr-2" />
            ) : (
              <Edit3 className="h-5 w-5 text-yellow-600 mr-2" />
            )}
            <h2 className="text-xl font-bold text-gray-800">
              {mode === 'view' ? 'Lihat Paket' : 'Edit Paket'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
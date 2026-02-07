// app/components/Navbar.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Package, LogOut, Menu } from 'lucide-react';

interface UserResponse {
  isLoggedIn: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function Navbar() {
  const [userData, setUserData] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Panggil API untuk mengecek status login dari cookie
    const fetchAuthStatus = async () => {
      try {
        const res = await fetch('/api/auth/status', {
          credentials: 'include', // Kirim cookie ke server
        });
        const data = await res.json();
        console.log('Auth status response:', data); // Debug log
        setUserData(data);
      } catch (err) {
        console.error('Error fetching auth status:', err);
        setUserData({ isLoggedIn: false });
      } finally {
        setLoading(false);
      }
    };

    fetchAuthStatus();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleLogout = () => {
    // Hapus cookie dari server (opsional, jika logout API menghapus cookie)
    // Untuk sekarang, cukup redirect ke login, server nanti akan menangani cookie
    router.push('/auth/logout');
  };

  if (loading) {
    return (
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-pink-600">
              Elegant Decor
            </Link>
            <div className="hidden md:flex space-x-6">
              <span className="text-gray-700">Memuat...</span>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-pink-600">
            Intan Wedding
          </Link>

          {/* Desktop Menu */}
          <nav className="hidden md:flex space-x-6">
            <Link href="/" className="text-gray-700 hover:text-pink-600 font-medium">
              Beranda
            </Link>
            {/* ✅ Gunakan userData dari API */}
            {userData?.isLoggedIn ? (
              // Jika user login, tampilkan dropdown
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-1 text-gray-700 hover:text-pink-600 font-medium"
                >
                  <User className="w-5 h-5" />
                  <span>{userData.user?.name}</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <Link
                      href="/orders"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Tracking Pesanan
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Jika user tidak login, tampilkan login/register
              <>
                <Link href="/auth/login" className="text-gray-700 hover:text-pink-600 font-medium">
                  <User className="w-5 h-5 inline-block mr-1" />Masuk
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-pink-600"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <Link href="/" className="block py-2 text-gray-700 hover:text-pink-600">
              Beranda
            </Link>
            {/* ✅ Gunakan userData dari API */}
            {userData?.isLoggedIn ? (
              <>
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-1 text-gray-700 hover:text-pink-600 py-2 w-full text-left"
                  >
                    <User className="w-5 h-5 mr-2" />
                    <span>{userData.user?.name}</span>
                  </button>

                  {dropdownOpen && (
                    <div className="ml-4 mt-1 space-y-1 bg-gray-50 rounded-md p-2">
                      <Link
                        href="/orders"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          setDropdownOpen(false);
                          setMobileMenuOpen(false);
                        }}
                      >
                        <Package className="w-4 h-4 mr-2" />
                        Tracking Pesanan
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="block py-2 text-gray-700 hover:text-pink-600">
                  Login
                </Link>
                <Link href="/auth/register" className="block py-2 text-gray-700 hover:text-pink-600">
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
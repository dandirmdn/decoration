// app/admin/packages/PackagesDataFetcher.tsx
"use server"
// Server Component
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fungsi untuk memeriksa akses admin
async function checkAdminAccess() {
  const cookieStore = cookies(); // Gunakan await
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

// Fungsi untuk mengambil daftar paket
async function getPackages() {
  const packages = await prisma.package.findMany({
    include: {
      package_items: true, // Sertakan item-item dalam paket
    },
    orderBy: {
      name: 'asc',
    },
  });
  return packages;
}

export default async function PackagesDataFetcher() {
  let adminUser, packages;

  try {
    adminUser = await checkAdminAccess();
    packages = await getPackages();
  } catch (error: any) {
    // Jika gagal, kembalikan error message ke client component
    return { error: error.message, packages: null, adminUser: null };
  }

  return { error: null, packages, adminUser };
}
// app/api/admin/packages/route.ts

import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { jwtVerify } from 'jose';

const prisma = new PrismaClient();

// Helper function untuk cek akses admin
async function checkAdminAccess(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value;

  if (!token) {
    return { allowed: false, status: 401, message: 'Akses ditolak. Token tidak ditemukan.' };
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');
    const decoded = await jwtVerify(token, secret);

    // Cari user untuk cek role
    const user = await prisma.user.findUnique({
      where: { id: decoded.payload.sub as string },
    });

    if (!user || user.role !== 'ADMIN') {
      return { allowed: false, status: 403, message: 'Akses ditolak. Hanya admin yang bisa mengakses.' };
    }

    return { allowed: true, user };
  } catch (error) {
    console.error('Admin access check failed:', error);
    return { allowed: false, status: 401, message: 'Token tidak valid.' };
  }
}

export async function GET(req: NextRequest) {
  const { allowed, status, message, user } = await checkAdminAccess(req);
  if (!allowed) {
    return new Response(
      JSON.stringify({ message }),
      { status: status || 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id'); // Jika ingin ambil detail satu paket

    if (id) {
      // Ambil detail paket tertentu
      const pkg = await prisma.package.findUnique({
        where: { id },
        include: {
          package_items: true, // Sertakan item-item dalam paket
        },
      });

      if (!pkg) {
        return new Response(
          JSON.stringify({ message: 'Paket tidak ditemukan.' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(pkg),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      // Ambil semua paket
      const packages = await prisma.package.findMany({
        include: {
          package_items: true,
        },
        orderBy: {
          name: 'asc', // Urutkan berdasarkan nama
        },
      });

      return new Response(
        JSON.stringify(packages),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error fetching packages:', error);
    return new Response(
      JSON.stringify({ message: 'Gagal mengambil data paket.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(req: NextRequest) {
  const { allowed, status, message, user } = await checkAdminAccess(req);
  if (!allowed) {
    return new Response(
      JSON.stringify({ message }),
      { status: status || 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { name, description, price, packageItems } = await req.json(); // packageItems adalah array [{name, price}, ...]

    // Validasi input sederhana
    if (!name || !price) {
      return new Response(
        JSON.stringify({ message: 'Nama dan harga harus diisi.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Buat paket
    const newPackage = await prisma.package.create({
       data: {
        name,
        description: description || null, // Handle null jika tidak diisi
        price: parseInt(price), // Pastikan harga adalah integer
      },
    });

    // Buat item-item dalam paket jika ada
    if (packageItems && Array.isArray(packageItems) && packageItems.length > 0) {
      const itemsToCreate = packageItems.map((item: any) => ({
        name: item.name,
        price: parseInt(item.price), // Pastikan harga item adalah integer
        packageId: newPackage.id,
      }));

      await prisma.packageItem.createMany({
        data: <any>itemsToCreate,
      });
    }

    // Ambil kembali paket lengkap dengan item
    const fullPackage = await prisma.package.findUnique({
      where: { id: newPackage.id },
      include: {
        package_items: true,
      },
    });

    return new Response(
      JSON.stringify({ message: 'Paket berhasil dibuat.', package: fullPackage }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error creating package:', error);
    return new Response(
      JSON.stringify({ message: 'Gagal membuat paket.', error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(req: NextRequest) {
  const { allowed, status, message, user } = await checkAdminAccess(req);
  if (!allowed) {
    return new Response(
      JSON.stringify({ message }),
      { status: status || 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { id, name, description, price, packageItems } = await req.json(); // id paket yang akan diupdate

    if (!id) {
      return new Response(
        JSON.stringify({ message: 'ID paket harus disertakan.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Cek apakah paket ada
    const existingPackage = await prisma.package.findUnique({
      where: { id },
    });

    if (!existingPackage) {
      return new Response(
        JSON.stringify({ message: 'Paket tidak ditemukan.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update detail dasar paket
    const updatedPackage = await prisma.package.update({
      where: { id },
       data: {
        name: name || existingPackage.name,
        description: description !== undefined ? description : existingPackage.description,
        price: price !== undefined ? parseInt(price) : existingPackage.price,
      },
    });

    // Hapus semua item lama (opsional, tergantung kebijakan)
    await prisma.packageItem.deleteMany({
      where: { package_id: id },
    });

    // Buat ulang item-item baru
    if (packageItems && Array.isArray(packageItems) && packageItems.length > 0) {
      const itemsToCreate = packageItems.map((item: any) => ({
        name: item.name,
        price: parseInt(item.price),
        packageId: updatedPackage.id,
      }));

      await prisma.packageItem.createMany({
         data: <any>itemsToCreate,
      });
    }

    // Ambil kembali paket lengkap setelah update
    const fullUpdatedPackage = await prisma.package.findUnique({
      where: { id: updatedPackage.id },
      include: {
        package_items: true,
      },
    });

    return new Response(
      JSON.stringify({ message: 'Paket berhasil diperbarui.', package: fullUpdatedPackage }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error updating package:', error);
    return new Response(
      JSON.stringify({ message: 'Gagal memperbarui paket.', error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(req: NextRequest) {
  const { allowed, status, message, user } = await checkAdminAccess(req);
  if (!allowed) {
    return new Response(
      JSON.stringify({ message }),
      { status: status || 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response(
        JSON.stringify({ message: 'ID paket harus disertakan.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Cek apakah paket ada
    const existingPackage = await prisma.package.findUnique({
      where: { id },
    });

    if (!existingPackage) {
      return new Response(
        JSON.stringify({ message: 'Paket tidak ditemukan.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Hapus paket (ini akan menghapus item-item terkait jika foreign key cascade diatur di schema)
    await prisma.package.delete({
      where: { id },
    });

    return new Response(
      JSON.stringify({ message: 'Paket berhasil dihapus.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error deleting package:', error);
    return new Response(
      JSON.stringify({ message: 'Gagal menghapus paket.', error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await prisma.$disconnect();
  }
}
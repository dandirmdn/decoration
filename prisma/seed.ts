import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Sedang mengisi data paket...')

  // Data Paket yang akan dimasukkan
  const packages = [
    {
      name: "Bronze Package",
      description: "Paket ekonomis untuk acara intim dan minimalis.",
      price: 20000000,
      items: [
        { name: "Dekorasi Pelaminan 4m", price: 10000000 },
        { name: "Makeup & Busana", price: 5000000 },
        { name: "Dokumentasi (1 Fotografer)", price: 5000000 },
      ]
    },
    {
      name: "Silver Package",
      description: "Paket lengkap untuk acara menengah dengan fasilitas premium.",
      price: 150000000,
      items: [
        { name: "Dekorasi Pelaminan 8m & Fresh Flower", price: 60000000 },
        { name: "Catering 500 Pax", price: 50000000 },
        { name: "Tenda & Alat Pesta Pro", price: 25000000 },
        { name: "Sound System & Entertainment", price: 15000000 },
      ]
    },
    {
      name: "Gold Package",
      description: "Paket Luxury eksklusif untuk acara megah di Ballroom.",
      price: 500000000,
      items: [
        { name: "Sewa Ballroom Hotel Bintang 5", price: 200000000 },
        { name: "Catering 1000 Pax Luxury Menu", price: 150000000 },
        { name: "Dekorasi Full Area & Lighting", price: 100000000 },
        { name: "Bintang Tamu / Artis", price: 50000000 },
      ]
    }
  ]

  // Loop untuk memasukkan data ke database
  for (const pkg of packages) {
    await prisma.package.create({
      data: {
        name: pkg.name,
        description: pkg.description,
        price: pkg.price,
        package_items: {
          create: pkg.items
        }
      }
    })
  }

  console.log('Seeding berhasil diselesaikan!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
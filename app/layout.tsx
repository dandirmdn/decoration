// app/layout.tsx

import './globals.css';
import Navbar from './components/Navbar'; // Sesuaikan path jika berbeda

export const metadata = {
  title: 'Intan Wedding',
  description: 'Dekorasi Pernikahan Impian Anda',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <Navbar /> {/* Navbar akan muncul di semua halaman di bawah layout ini */}
        <main>{children}</main>
      </body>
    </html>
  );
}
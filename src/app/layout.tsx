import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Murray Aspinwall LP - Rental Property Investment Manager',
  description: 'Manage rental property research, financial modeling, and portfolio tracking',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-auto bg-muted/30 p-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}

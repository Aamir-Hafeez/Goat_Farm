import './globals.css';
import React from 'react';
import type { Metadata, Viewport } from 'next';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'My Goat — Farm Management',
  description: 'Goat breeding cycle and farm management system',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-softGray text-slate-800">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

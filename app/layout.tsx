import React from 'react';
import './globals.css';

export const metadata = {
  title: 'NextGen POS Pro - Retail & Supermarket POS System',
  description: 'Production-ready full-stack retail POS application with real-time database synchronization.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 bg-grid-pattern text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}

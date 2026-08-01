'use client';

import React from 'react';
import { StoreProvider, useStore } from '@/context/StoreContext';
import HeaderBar from '@/components/common/HeaderBar';
import LoginPage from '@/components/common/LoginPage';

// Owner Components
import OwnerSidebar from '@/components/owner/OwnerSidebar';
import OwnerBottomNav from '@/components/owner/OwnerBottomNav';
import OwnerDashboard from '@/components/owner/OwnerDashboard';
import OwnerInventory from '@/components/owner/OwnerInventory';
import OwnerSales from '@/components/owner/OwnerSales';
import OwnerReports from '@/components/owner/OwnerReports';
import OwnerMore from '@/components/owner/OwnerMore';

// Cashier Components
import CashierBottomNav from '@/components/cashier/CashierBottomNav';
import CashierDashboard from '@/components/cashier/CashierDashboard';
import CashierPOS from '@/components/cashier/CashierPOS';
import CashierScanner from '@/components/cashier/CashierScanner';
import CashierHistory from '@/components/cashier/CashierHistory';
import CashierProfile from '@/components/cashier/CashierProfile';

function MainAppContent() {
  const { role, ownerTab, cashierTab, isAuthenticated } = useStore();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 bg-grid-pattern text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white flex flex-col justify-center">
        <LoginPage />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 bg-grid-pattern text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white flex flex-col">
      {/* Header Bar */}
      <HeaderBar />

      {/* OWNER APP LAYOUT */}
      {role === 'OWNER' && (
        <div className="flex-1 flex overflow-hidden">
          {/* Desktop Sidebar (visible on large screens) */}
          <OwnerSidebar />

          {/* Main Owner Content Area */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 pb-20 lg:pb-8">
            <div className="max-w-7xl mx-auto">
              {ownerTab === 0 && <OwnerDashboard />}
              {ownerTab === 1 && <OwnerInventory />}
              {ownerTab === 2 && <OwnerSales />}
              {ownerTab === 3 && <OwnerReports />}
              {ownerTab === 4 && <OwnerMore />}
            </div>
          </main>

          {/* Mobile & Tablet Navigation Tabs for Owner (visible on mobile/tablet) */}
          <div className="lg:hidden">
            <OwnerBottomNav />
          </div>
        </div>
      )}

      {/* CASHIER MOBILE & TABLET APP LAYOUT */}
      {role === 'CASHIER' && (
        <div className="flex-1 flex flex-col items-center justify-start p-2 sm:p-4 pb-20 sm:pb-24">
          <div className="w-full max-w-3xl bg-slate-950 border border-slate-800 rounded-2xl p-3 sm:p-5 min-h-[calc(100vh-100px)] flex flex-col justify-between relative shadow-2xl my-2">
            <div>
              {cashierTab === 0 && <CashierDashboard />}
              {cashierTab === 1 && <CashierPOS />}
              {cashierTab === 2 && <CashierScanner />}
              {cashierTab === 3 && <CashierHistory />}
              {cashierTab === 4 && <CashierProfile />}
            </div>

            {/* Fixed 5-Tab Cashier Bottom Navigation Bar */}
            <CashierBottomNav />
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <StoreProvider>
      <MainAppContent />
    </StoreProvider>
  );
}

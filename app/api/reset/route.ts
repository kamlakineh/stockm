import { NextResponse } from 'next/server';
import { getNeonSql, initNeonDb } from '@/lib/db';
import { memoryStore } from '@/lib/memoryStore';
import {
  initialCategories,
  initialSuppliers,
  initialProducts,
  initialCashiers,
  initialSales,
  initialStockMovements,
  initialSettings,
  initialActivityLogs
} from '@/data/initialData';

export async function POST() {
  try {
    memoryStore.categories = [...initialCategories];
    memoryStore.suppliers = [...initialSuppliers];
    memoryStore.products = [...initialProducts];
    memoryStore.profiles = [...initialCashiers];
    memoryStore.cashiers = [...initialCashiers];
    memoryStore.sales = [...initialSales];
    memoryStore.stockMovements = [...initialStockMovements];
    memoryStore.activityLogs = [...initialActivityLogs];
    memoryStore.settings = { ...initialSettings };

    const sql = getNeonSql();
    if (sql) {
      try {
        await sql`TRUNCATE TABLE categories, suppliers, products, profiles, sales, stock_movements, activity_logs, settings;`;
        await initNeonDb();
      } catch (e) {
        console.error('Reset Neon error:', e);
      }
    }

    return NextResponse.json({ success: true, data: memoryStore });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

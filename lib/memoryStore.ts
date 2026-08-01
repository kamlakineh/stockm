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

export const memoryStore = {
  categories: [...initialCategories],
  suppliers: [...initialSuppliers],
  products: [...initialProducts],
  profiles: [...initialCashiers],
  cashiers: [...initialCashiers],
  sales: [...initialSales],
  stockMovements: [...initialStockMovements],
  activityLogs: [...initialActivityLogs],
  settings: { ...initialSettings }
};

import express from 'express';
import path from 'path';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { UTApi } from 'uploadthing/server';
import { getNeonSql, initNeonDb } from './server/db';
import {
  initialCategories,
  initialSuppliers,
  initialProducts,
  initialCashiers,
  initialSales,
  initialStockMovements,
  initialSettings,
  initialActivityLogs
} from './src/data/initialData';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

// Set up Multer for handling file uploads in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Helper for UploadThing API
function getUploadThingApi() {
  const token = process.env.UPLOADTHING_TOKEN;
  if (!token || !token.trim()) return null;
  try {
    return new UTApi({ token: token.trim() });
  } catch (e) {
    console.error('Failed to initialize UTApi:', e);
    return null;
  }
}

// Memory fallback store if DATABASE_URL is not provided
let memoryStore = {
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

// Initialize Neon DB on server boot if DATABASE_URL is present
let isNeonDbConnected = false;
initNeonDb().then(connected => {
  isNeonDbConnected = connected;
});

// --- API ROUTES ---

// 1. Check Status & Database Connection
app.get('/api/status', async (req, res) => {
  const sql = getNeonSql();
  let dbStatus = 'NOT_CONNECTED';
  if (sql) {
    try {
      await sql`SELECT 1;`;
      dbStatus = 'CONNECTED';
    } catch (e) {
      dbStatus = 'ERROR';
    }
  }

  const uploadThingConfigured = !!(process.env.UPLOADTHING_TOKEN && process.env.UPLOADTHING_TOKEN.trim());

  res.json({
    status: 'ok',
    neonDatabase: {
      status: dbStatus,
      databaseUrlSet: !!process.env.DATABASE_URL
    },
    uploadThing: {
      configured: uploadThingConfigured
    }
  });
});

// 2. Load All Store Data
app.get('/api/data', async (req, res) => {
  const sql = getNeonSql();

  if (!sql) {
    return res.json({
      source: 'memory',
      data: memoryStore
    });
  }

  try {
    const [
      categories,
      suppliers,
      products,
      profiles,
      sales,
      stockMovements,
      activityLogs,
      settingsRows
    ] = await Promise.all([
      sql`SELECT id, name, description, item_count as "itemCount", is_hidden as "isHidden", sort_order as "sortOrder" FROM categories ORDER BY sort_order ASC, name ASC;`,
      sql`SELECT id, name, contact_person as "contactPerson", phone, email, address, status, supplied_count as "suppliedCount" FROM suppliers ORDER BY name ASC;`,
      sql`SELECT id, name, barcode, category_id as "categoryId", category_name as "categoryName", supplier_id as "supplierId", supplier_name as "supplierName", cost_price::float as "costPrice", selling_price::float as "sellingPrice", stock_quantity as "stockQuantity", min_stock_level as "minStockLevel", image_url as "imageUrl", is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt" FROM products ORDER BY name ASC;`,
      sql`SELECT id, employee_id as "employeeId", name, COALESCE(role, 'CASHIER') as "role", email, phone, pin, avatar_url as "avatarUrl", is_active as "isActive", can_give_discount as "canGiveDiscount", max_discount_percent as "maxDiscountPercent", can_process_refund as "canProcessRefund", COALESCE(can_add_products, FALSE) as "canAddProducts", current_shift_started_at as "currentShiftStartedAt", today_sales_count as "todaySalesCount", today_sales_total::float as "todaySalesTotal" FROM profiles ORDER BY name ASC;`,
      sql`SELECT id, receipt_no as "receiptNo", cashier_id as "cashierId", cashier_name as "cashierName", items, subtotal::float, tax_amount::float as "taxAmount", discount_amount::float as "discountAmount", discount_reason as "discountReason", total_amount::float as "totalAmount", cost_amount::float as "costAmount", profit_amount::float as "profitAmount", payment_method as "paymentMethod", amount_tendered::float as "amountTendered", change_given::float as "changeGiven", status, refund_reason as "refundReason", refund_approved_by as "refundApprovedBy", created_at as "createdAt" FROM sales ORDER BY created_at DESC;`,
      sql`SELECT id, product_id as "productId", product_name as "productName", type, quantity_change as "quantityChange", previous_quantity as "previousQuantity", new_quantity as "newQuantity", reason, performed_by as "performedBy", created_at as "createdAt" FROM stock_movements ORDER BY created_at DESC LIMIT 200;`,
      sql`SELECT id, action, user_name as "user", role, details, created_at as "createdAt" FROM activity_logs ORDER BY created_at DESC LIMIT 200;`,
      sql`SELECT data FROM settings WHERE id = 'main_settings';`
    ]);

    const settings = settingsRows[0]?.data || initialSettings;

    return res.json({
      source: 'neon',
      data: {
        categories,
        suppliers,
        products,
        profiles,
        cashiers: profiles, // Backward compatibility alias
        sales,
        stockMovements,
        activityLogs,
        settings
      }
    });
  } catch (err) {
    console.error('Error fetching data from Neon DB:', err);
    return res.json({
      source: 'memory_fallback',
      data: memoryStore
    });
  }
});

// 3. Save / Update Full Store State
app.post('/api/sync-state', async (req, res) => {
  const { categories, suppliers, products, profiles: reqProfiles, cashiers: reqCashiers, sales, stockMovements, activityLogs, settings } = req.body;
  const targetProfiles = reqProfiles || reqCashiers;

  if (categories) memoryStore.categories = categories;
  if (suppliers) memoryStore.suppliers = suppliers;
  if (products) memoryStore.products = products;
  if (targetProfiles) {
    memoryStore.profiles = targetProfiles;
    memoryStore.cashiers = targetProfiles;
  }
  if (sales) memoryStore.sales = sales;
  if (stockMovements) memoryStore.stockMovements = stockMovements;
  if (activityLogs) memoryStore.activityLogs = activityLogs;
  if (settings) memoryStore.settings = settings;

  const sql = getNeonSql();
  if (sql) {
    try {
      if (settings) {
        await sql`
          INSERT INTO settings (id, data) VALUES ('main_settings', ${JSON.stringify(settings)})
          ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data;
        `;
      }
      if (targetProfiles && Array.isArray(targetProfiles)) {
        for (const profile of targetProfiles) {
          await sql`
            INSERT INTO profiles (id, employee_id, name, role, email, phone, pin, avatar_url, is_active, can_give_discount, max_discount_percent, can_process_refund, can_add_products, current_shift_started_at, today_sales_count, today_sales_total)
            VALUES (${profile.id}, ${profile.employeeId}, ${profile.name}, ${profile.role || 'CASHIER'}, ${profile.email || ''}, ${profile.phone || ''}, ${profile.pin}, ${profile.avatarUrl || ''}, ${profile.isActive}, ${profile.canGiveDiscount}, ${profile.maxDiscountPercent}, ${profile.canProcessRefund}, ${profile.canAddProducts || false}, ${profile.currentShiftStartedAt || null}, ${profile.todaySalesCount || 0}, ${profile.todaySalesTotal || 0})
            ON CONFLICT (id) DO UPDATE SET
              employee_id = EXCLUDED.employee_id,
              name = EXCLUDED.name,
              role = EXCLUDED.role,
              email = EXCLUDED.email,
              phone = EXCLUDED.phone,
              pin = EXCLUDED.pin,
              avatar_url = EXCLUDED.avatar_url,
              is_active = EXCLUDED.is_active,
              can_give_discount = EXCLUDED.can_give_discount,
              max_discount_percent = EXCLUDED.max_discount_percent,
              can_process_refund = EXCLUDED.can_process_refund,
              can_add_products = EXCLUDED.can_add_products,
              current_shift_started_at = EXCLUDED.current_shift_started_at,
              today_sales_count = EXCLUDED.today_sales_count,
              today_sales_total = EXCLUDED.today_sales_total;
          `;
        }
      }
    } catch (e) {
      console.error('Neon sync error:', e);
    }
  }

  res.json({ success: true });
});

// 4. Profiles / Cashiers CRUD in Neon (Stores Owner and Cashiers)
const handleUpsertProfile = async (req: express.Request, res: express.Response) => {
  const profile = req.body;
  const sql = getNeonSql();

  const existingIdx = memoryStore.profiles.findIndex(p => p.id === profile.id);
  if (existingIdx >= 0) {
    memoryStore.profiles[existingIdx] = profile;
  } else {
    memoryStore.profiles.push(profile);
  }
  memoryStore.cashiers = memoryStore.profiles;

  if (sql) {
    try {
      await sql`
        INSERT INTO profiles (id, employee_id, name, role, email, phone, pin, avatar_url, is_active, can_give_discount, max_discount_percent, can_process_refund, can_add_products, current_shift_started_at, today_sales_count, today_sales_total)
        VALUES (${profile.id}, ${profile.employeeId}, ${profile.name}, ${profile.role || 'CASHIER'}, ${profile.email || ''}, ${profile.phone || ''}, ${profile.pin}, ${profile.avatarUrl || ''}, ${profile.isActive}, ${profile.canGiveDiscount}, ${profile.maxDiscountPercent}, ${profile.canProcessRefund}, ${profile.canAddProducts || false}, ${profile.currentShiftStartedAt || null}, ${profile.todaySalesCount || 0}, ${profile.todaySalesTotal || 0})
        ON CONFLICT (id) DO UPDATE SET
          employee_id = EXCLUDED.employee_id,
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          pin = EXCLUDED.pin,
          avatar_url = EXCLUDED.avatar_url,
          is_active = EXCLUDED.is_active,
          can_give_discount = EXCLUDED.can_give_discount,
          max_discount_percent = EXCLUDED.max_discount_percent,
          can_process_refund = EXCLUDED.can_process_refund,
          can_add_products = EXCLUDED.can_add_products,
          current_shift_started_at = EXCLUDED.current_shift_started_at,
          today_sales_count = EXCLUDED.today_sales_count,
          today_sales_total = EXCLUDED.today_sales_total;
      `;
    } catch (err) {
      console.error('Error upserting profile in Neon:', err);
    }
  }

  res.json({ success: true, profile });
};

const handleDeleteProfile = async (req: express.Request, res: express.Response) => {
  const id = req.params.id;
  memoryStore.profiles = memoryStore.profiles.filter(c => c.id !== id);
  memoryStore.cashiers = memoryStore.profiles;

  const sql = getNeonSql();
  if (sql) {
    try {
      await sql`DELETE FROM profiles WHERE id = ${id};`;
    } catch (err) {
      console.error('Error deleting profile from Neon:', err);
    }
  }

  res.json({ success: true });
};

app.post('/api/profiles', handleUpsertProfile);
app.post('/api/cashiers', handleUpsertProfile);
app.delete('/api/profiles/:id', handleDeleteProfile);
app.delete('/api/cashiers/:id', handleDeleteProfile);

// 4. Products CRUD in Neon
app.post('/api/products', async (req, res) => {
  const prod = req.body;
  const sql = getNeonSql();

  // Update memory store
  const existingIdx = memoryStore.products.findIndex(p => p.id === prod.id);
  if (existingIdx >= 0) {
    memoryStore.products[existingIdx] = prod;
  } else {
    memoryStore.products.push(prod);
  }

  if (sql) {
    try {
      await sql`
        INSERT INTO products (id, name, barcode, category_id, category_name, supplier_id, supplier_name, cost_price, selling_price, stock_quantity, min_stock_level, image_url, is_active, created_at, updated_at)
        VALUES (${prod.id}, ${prod.name}, ${prod.barcode}, ${prod.categoryId}, ${prod.categoryName}, ${prod.supplierId}, ${prod.supplierName}, ${prod.costPrice}, ${prod.sellingPrice}, ${prod.stockQuantity}, ${prod.minStockLevel}, ${prod.imageUrl || ''}, ${prod.isActive}, ${prod.createdAt}, ${prod.updatedAt})
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          barcode = EXCLUDED.barcode,
          category_id = EXCLUDED.category_id,
          category_name = EXCLUDED.category_name,
          supplier_id = EXCLUDED.supplier_id,
          supplier_name = EXCLUDED.supplier_name,
          cost_price = EXCLUDED.cost_price,
          selling_price = EXCLUDED.selling_price,
          stock_quantity = EXCLUDED.stock_quantity,
          min_stock_level = EXCLUDED.min_stock_level,
          image_url = EXCLUDED.image_url,
          is_active = EXCLUDED.is_active,
          updated_at = EXCLUDED.updated_at;
      `;
    } catch (err) {
      console.error('Error upserting product in Neon:', err);
    }
  }

  res.json({ success: true, product: prod });
});

app.delete('/api/products/:id', async (req, res) => {
  const id = req.params.id;
  memoryStore.products = memoryStore.products.filter(p => p.id !== id);

  const sql = getNeonSql();
  if (sql) {
    try {
      await sql`DELETE FROM products WHERE id = ${id};`;
    } catch (err) {
      console.error('Error deleting product from Neon:', err);
    }
  }

  res.json({ success: true });
});

// 5. UploadThing Image Upload Endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const utApi = getUploadThingApi();
    if (utApi) {
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
      const fileObj = new File([blob], req.file.originalname || `upload-${Date.now()}.png`, { type: req.file.mimetype });
      
      const response = await utApi.uploadFiles(fileObj);
      if (response.data && response.data.url) {
        return res.json({
          success: true,
          url: response.data.url,
          source: 'uploadthing'
        });
      }
    }

    // Fallback if UploadThing token is not set or failed: return Data URL
    const base64 = req.file.buffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${base64}`;
    return res.json({
      success: true,
      url: dataUrl,
      source: 'local_data_url'
    });
  } catch (err: any) {
    console.error('Upload endpoint error:', err);
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

// --- VITE MIDDLEWARE & SERVER BOOT ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

import { neon } from '@neondatabase/serverless';
import {
  initialCategories,
  initialSuppliers,
  initialProducts,
  initialCashiers,
  initialSales,
  initialStockMovements,
  initialSettings,
  initialActivityLogs
} from '../data/initialData';

export function getNeonSql() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || !dbUrl.trim() || dbUrl === 'undefined') {
    return null;
  }
  try {
    return neon(dbUrl.trim());
  } catch (err) {
    console.error('Error initializing Neon SQL client:', err);
    return null;
  }
}

export async function initNeonDb() {
  const sql = getNeonSql();
  if (!sql) {
    console.log('DATABASE_URL environment variable is not configured. Running in local/fallback memory mode.');
    return false;
  }

  try {
    console.log('Initializing Neon PostgreSQL database tables...');

    // 1. Categories
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        item_count INT DEFAULT 0,
        is_hidden BOOLEAN DEFAULT FALSE,
        sort_order INT DEFAULT 0
      );
    `;

    // 2. Suppliers
    await sql`
      CREATE TABLE IF NOT EXISTS suppliers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        contact_person TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        status TEXT DEFAULT 'ACTIVE',
        supplied_count INT DEFAULT 0
      );
    `;

    // 3. Products
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        barcode TEXT,
        category_id TEXT,
        category_name TEXT,
        supplier_id TEXT,
        supplier_name TEXT,
        cost_price NUMERIC(12, 2) DEFAULT 0,
        selling_price NUMERIC(12, 2) DEFAULT 0,
        stock_quantity INT DEFAULT 0,
        min_stock_level INT DEFAULT 5,
        image_url TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TEXT,
        updated_at TEXT
      );
    `;

    // 4. Profiles (System Users: Owners & Cashiers)
    await sql`
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'CASHIER',
        email TEXT,
        phone TEXT,
        pin TEXT,
        avatar_url TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        can_give_discount BOOLEAN DEFAULT TRUE,
        max_discount_percent INT DEFAULT 15,
        can_process_refund BOOLEAN DEFAULT FALSE,
        can_add_products BOOLEAN DEFAULT FALSE,
        current_shift_started_at TEXT,
        today_sales_count INT DEFAULT 0,
        today_sales_total NUMERIC(12, 2) DEFAULT 0
      );
    `;

    // Migration helper: ensure role column exists in profiles
    await sql`
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'CASHIER';
    `;

    // Migration helper: copy existing cashiers data to profiles if cashiers table exists
    try {
      await sql`
        INSERT INTO profiles (id, employee_id, name, role, email, phone, pin, avatar_url, is_active, can_give_discount, max_discount_percent, can_process_refund, can_add_products, current_shift_started_at, today_sales_count, today_sales_total)
        SELECT id, employee_id, name, COALESCE(role, 'CASHIER'), email, phone, pin, avatar_url, is_active, can_give_discount, max_discount_percent, can_process_refund, COALESCE(can_add_products, FALSE), current_shift_started_at, today_sales_count, today_sales_total
        FROM cashiers
        ON CONFLICT (id) DO NOTHING;
      `;
    } catch (e) {
      // cashiers table might not exist in new instances, ignore
    }

    // 5. Sales
    await sql`
      CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY,
        receipt_no TEXT,
        cashier_id TEXT,
        cashier_name TEXT,
        items JSONB,
        subtotal NUMERIC(12, 2),
        tax_amount NUMERIC(12, 2),
        discount_amount NUMERIC(12, 2),
        discount_reason TEXT,
        total_amount NUMERIC(12, 2),
        cost_amount NUMERIC(12, 2),
        profit_amount NUMERIC(12, 2),
        payment_method TEXT,
        amount_tendered NUMERIC(12, 2),
        change_given NUMERIC(12, 2),
        status TEXT,
        refund_reason TEXT,
        refund_approved_by TEXT,
        created_at TEXT
      );
    `;

    // 6. Stock Movements
    await sql`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id TEXT PRIMARY KEY,
        product_id TEXT,
        product_name TEXT,
        type TEXT,
        quantity_change INT,
        previous_quantity INT,
        new_quantity INT,
        reason TEXT,
        performed_by TEXT,
        created_at TEXT
      );
    `;

    // 7. Activity Logs
    await sql`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY,
        action TEXT,
        user_name TEXT,
        role TEXT,
        details TEXT,
        created_at TEXT
      );
    `;

    // 8. Settings
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        data JSONB
      );
    `;

    // Seed initial data if tables are empty
    const productCountResult = await sql`SELECT COUNT(*)::int as count FROM products;`;
    const productCount = productCountResult[0]?.count || 0;

    if (productCount === 0) {
      console.log('Seeding Neon PostgreSQL database with initial data...');

      // Seed Categories
      for (const cat of initialCategories) {
        await sql`
          INSERT INTO categories (id, name, description, item_count, is_hidden, sort_order)
          VALUES (${cat.id}, ${cat.name}, ${cat.description || ''}, ${cat.itemCount || 0}, ${cat.isHidden || false}, ${cat.sortOrder || 0})
          ON CONFLICT (id) DO NOTHING;
        `;
      }

      // Seed Suppliers
      for (const sup of initialSuppliers) {
        await sql`
          INSERT INTO suppliers (id, name, contact_person, phone, email, address, status, supplied_count)
          VALUES (${sup.id}, ${sup.name}, ${sup.contactPerson || ''}, ${sup.phone || ''}, ${sup.email || ''}, ${sup.address || ''}, ${sup.status || 'ACTIVE'}, ${sup.suppliedCount || 0})
          ON CONFLICT (id) DO NOTHING;
        `;
      }

      // Seed Products
      for (const prod of initialProducts) {
        await sql`
          INSERT INTO products (id, name, barcode, category_id, category_name, supplier_id, supplier_name, cost_price, selling_price, stock_quantity, min_stock_level, image_url, is_active, created_at, updated_at)
          VALUES (${prod.id}, ${prod.name}, ${prod.barcode}, ${prod.categoryId}, ${prod.categoryName}, ${prod.supplierId}, ${prod.supplierName}, ${prod.costPrice}, ${prod.sellingPrice}, ${prod.stockQuantity}, ${prod.minStockLevel}, ${prod.imageUrl || ''}, ${prod.isActive}, ${prod.createdAt}, ${prod.updatedAt})
          ON CONFLICT (id) DO NOTHING;
        `;
      }

      // Seed Profiles (User accounts: Owner and Cashiers)
      for (const profile of initialCashiers) {
        await sql`
          INSERT INTO profiles (id, employee_id, name, role, email, phone, pin, avatar_url, is_active, can_give_discount, max_discount_percent, can_process_refund, can_add_products, current_shift_started_at, today_sales_count, today_sales_total)
          VALUES (${profile.id}, ${profile.employeeId}, ${profile.name}, ${profile.role || 'CASHIER'}, ${profile.email || ''}, ${profile.phone || ''}, ${profile.pin}, ${profile.avatarUrl || ''}, ${profile.isActive}, ${profile.canGiveDiscount}, ${profile.maxDiscountPercent}, ${profile.canProcessRefund}, ${profile.canAddProducts || false}, ${profile.currentShiftStartedAt || null}, ${profile.todaySalesCount || 0}, ${profile.todaySalesTotal || 0})
          ON CONFLICT (id) DO NOTHING;
        `;
      }

      // Seed Sales
      for (const s of initialSales) {
        await sql`
          INSERT INTO sales (id, receipt_no, cashier_id, cashier_name, items, subtotal, tax_amount, discount_amount, discount_reason, total_amount, cost_amount, profit_amount, payment_method, amount_tendered, change_given, status, refund_reason, refund_approved_by, created_at)
          VALUES (${s.id}, ${s.receiptNo}, ${s.cashierId}, ${s.cashierName}, ${JSON.stringify(s.items)}, ${s.subtotal}, ${s.taxAmount}, ${s.discountAmount}, ${s.discountReason || ''}, ${s.totalAmount}, ${s.costAmount}, ${s.profitAmount}, ${s.paymentMethod}, ${s.amountTendered}, ${s.changeGiven}, ${s.status}, ${s.refundReason || ''}, ${s.refundApprovedBy || ''}, ${s.createdAt})
          ON CONFLICT (id) DO NOTHING;
        `;
      }

      // Seed Stock Movements
      for (const sm of initialStockMovements) {
        await sql`
          INSERT INTO stock_movements (id, product_id, product_name, type, quantity_change, previous_quantity, new_quantity, reason, performed_by, created_at)
          VALUES (${sm.id}, ${sm.productId}, ${sm.productName}, ${sm.type}, ${sm.quantityChange}, ${sm.previousQuantity}, ${sm.newQuantity}, ${sm.reason}, ${sm.performedBy}, ${sm.createdAt})
          ON CONFLICT (id) DO NOTHING;
        `;
      }

      // Seed Activity Logs
      for (const al of initialActivityLogs) {
        await sql`
          INSERT INTO activity_logs (id, action, user_name, role, details, created_at)
          VALUES (${al.id}, ${al.action}, ${al.user}, ${al.role}, ${al.details}, ${al.createdAt})
          ON CONFLICT (id) DO NOTHING;
        `;
      }

      // Seed Settings
      await sql`
        INSERT INTO settings (id, data)
        VALUES ('main_settings', ${JSON.stringify(initialSettings)})
        ON CONFLICT (id) DO NOTHING;
      `;

      console.log('Successfully seeded Neon PostgreSQL database tables!');
    }

    return true;
  } catch (err) {
    console.error('Error during Neon DB setup:', err);
    return false;
  }
}

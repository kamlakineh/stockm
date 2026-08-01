import { NextResponse } from 'next/server';
import { getNeonSql, initNeonDb } from '@/lib/db';
import { memoryStore } from '@/lib/memoryStore';
import { initialSettings } from '@/data/initialData';

let isInitAttempted = false;

export async function GET() {
  if (!isInitAttempted) {
    isInitAttempted = true;
    initNeonDb().catch(e => console.error('Error auto-init Neon DB:', e));
  }

  const sql = getNeonSql();

  if (!sql) {
    return NextResponse.json({
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

    return NextResponse.json({
      source: 'neon',
      data: {
        categories,
        suppliers,
        products,
        profiles,
        cashiers: profiles,
        sales,
        stockMovements,
        activityLogs,
        settings
      }
    });
  } catch (err) {
    console.error('Error fetching data from Neon DB:', err);
    return NextResponse.json({
      source: 'memory_fallback',
      data: memoryStore
    });
  }
}

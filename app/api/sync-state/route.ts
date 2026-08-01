import { NextRequest, NextResponse } from 'next/server';
import { getNeonSql } from '@/lib/db';
import { memoryStore } from '@/lib/memoryStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { categories, suppliers, products, profiles: reqProfiles, cashiers: reqCashiers, sales, stockMovements, activityLogs, settings } = body;
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

        if (categories && Array.isArray(categories)) {
          for (const cat of categories) {
            await sql`
              INSERT INTO categories (id, name, description, item_count, is_hidden, sort_order)
              VALUES (${cat.id}, ${cat.name}, ${cat.description || ''}, ${cat.itemCount || 0}, ${cat.isHidden || false}, ${cat.sortOrder || 0})
              ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                item_count = EXCLUDED.item_count,
                is_hidden = EXCLUDED.is_hidden,
                sort_order = EXCLUDED.sort_order;
            `;
          }
        }

        if (suppliers && Array.isArray(suppliers)) {
          for (const sup of suppliers) {
            await sql`
              INSERT INTO suppliers (id, name, contact_person, phone, email, address, status, supplied_count)
              VALUES (${sup.id}, ${sup.name}, ${sup.contactPerson || ''}, ${sup.phone || ''}, ${sup.email || ''}, ${sup.address || ''}, ${sup.status || 'ACTIVE'}, ${sup.suppliedCount || 0})
              ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                contact_person = EXCLUDED.contact_person,
                phone = EXCLUDED.phone,
                email = EXCLUDED.email,
                address = EXCLUDED.address,
                status = EXCLUDED.status,
                supplied_count = EXCLUDED.supplied_count;
            `;
          }
        }

        if (products && Array.isArray(products)) {
          for (const prod of products) {
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
          }
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

        if (sales && Array.isArray(sales)) {
          for (const s of sales) {
            await sql`
              INSERT INTO sales (id, receipt_no, cashier_id, cashier_name, items, subtotal, tax_amount, discount_amount, discount_reason, total_amount, cost_amount, profit_amount, payment_method, amount_tendered, change_given, status, refund_reason, refund_approved_by, created_at)
              VALUES (${s.id}, ${s.receiptNo}, ${s.cashierId}, ${s.cashierName}, ${JSON.stringify(s.items)}, ${s.subtotal}, ${s.taxAmount}, ${s.discountAmount}, ${s.discountReason || ''}, ${s.totalAmount}, ${s.costAmount}, ${s.profitAmount}, ${s.paymentMethod}, ${s.amountTendered}, ${s.changeGiven}, ${s.status}, ${s.refundReason || ''}, ${s.refundApprovedBy || ''}, ${s.createdAt})
              ON CONFLICT (id) DO UPDATE SET
                status = EXCLUDED.status,
                refund_reason = EXCLUDED.refund_reason,
                refund_approved_by = EXCLUDED.refund_approved_by;
            `;
          }
        }

        if (stockMovements && Array.isArray(stockMovements)) {
          for (const sm of stockMovements) {
            await sql`
              INSERT INTO stock_movements (id, product_id, product_name, type, quantity_change, previous_quantity, new_quantity, reason, performed_by, created_at)
              VALUES (${sm.id}, ${sm.productId}, ${sm.productName}, ${sm.type}, ${sm.quantityChange}, ${sm.previousQuantity}, ${sm.newQuantity}, ${sm.reason}, ${sm.performedBy}, ${sm.createdAt})
              ON CONFLICT (id) DO NOTHING;
            `;
          }
        }

        if (activityLogs && Array.isArray(activityLogs)) {
          for (const al of activityLogs) {
            await sql`
              INSERT INTO activity_logs (id, action, user_name, role, details, created_at)
              VALUES (${al.id}, ${al.action}, ${al.user}, ${al.role}, ${al.details}, ${al.createdAt})
              ON CONFLICT (id) DO NOTHING;
            `;
          }
        }
      } catch (e) {
        console.error('Neon sync error:', e);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

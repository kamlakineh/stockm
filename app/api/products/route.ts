import { NextRequest, NextResponse } from 'next/server';
import { getNeonSql } from '@/lib/db';
import { memoryStore } from '@/lib/memoryStore';

export async function POST(req: NextRequest) {
  try {
    const prod = await req.json();
    const sql = getNeonSql();

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

    return NextResponse.json({ success: true, product: prod });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

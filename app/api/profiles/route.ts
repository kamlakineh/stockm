import { NextRequest, NextResponse } from 'next/server';
import { getNeonSql } from '@/lib/db';
import { memoryStore } from '@/lib/memoryStore';

export async function POST(req: NextRequest) {
  try {
    const profile = await req.json();
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

    return NextResponse.json({ success: true, profile });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

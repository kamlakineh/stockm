import { NextRequest, NextResponse } from 'next/server';
import { getNeonSql } from '@/lib/db';
import { memoryStore } from '@/lib/memoryStore';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    memoryStore.categories = memoryStore.categories.filter(c => c.id !== id);

    const sql = getNeonSql();
    if (sql) {
      try {
        await sql`DELETE FROM categories WHERE id = ${id};`;
      } catch (err) {
        console.error('Error deleting category from Neon:', err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

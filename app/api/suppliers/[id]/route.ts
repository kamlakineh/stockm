import { NextRequest, NextResponse } from 'next/server';
import { getNeonSql } from '@/lib/db';
import { memoryStore } from '@/lib/memoryStore';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    memoryStore.suppliers = memoryStore.suppliers.filter(s => s.id !== id);

    const sql = getNeonSql();
    if (sql) {
      try {
        await sql`DELETE FROM suppliers WHERE id = ${id};`;
      } catch (err) {
        console.error('Error deleting supplier from Neon:', err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

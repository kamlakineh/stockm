import { NextResponse } from 'next/server';
import { getNeonSql } from '@/lib/db';

export async function GET() {
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

  return NextResponse.json({
    status: 'ok',
    neonDatabase: {
      status: dbStatus,
      databaseUrlSet: !!process.env.DATABASE_URL
    },
    uploadThing: {
      configured: uploadThingConfigured
    }
  });
}

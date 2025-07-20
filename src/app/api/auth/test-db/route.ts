import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { employees } from '@/lib/database/schema';

export async function GET() {
  try {
    // Test basic database connection
    const result = await db
      .select({
        count: employees.empCode,
      })
      .from(employees)
      .limit(1);

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
      nodeEnv: process.env.NODE_ENV,
      result: result.length > 0 ? 'Data found' : 'No data',
    });
  } catch (error: any) {
    console.error('Database test error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      message: error.message || 'Unknown error',
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
      nodeEnv: process.env.NODE_ENV,
      errorType: error.constructor.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}
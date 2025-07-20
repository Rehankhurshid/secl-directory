import { NextResponse } from 'next/server';

export async function GET() {
  const password = 'yKMJf@FP#Hxk6C9';
  const encodedPassword = 'yKMJf@FP%23Hxk6C9';
  
  return NextResponse.json({
    status: 'API is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    databaseUrl: {
      isSet: !!process.env.DATABASE_URL,
      length: process.env.DATABASE_URL?.length,
      includesHash: process.env.DATABASE_URL?.includes('#') || false,
      includesEncodedHash: process.env.DATABASE_URL?.includes('%23') || false,
    },
    passwordInfo: {
      original: password,
      encoded: encodedPassword,
      note: 'The # character must be encoded as %23 in URLs'
    },
    correctDatabaseUrl: 'postgresql://postgres.edxaomipjyqsldcbwaxr:yKMJf@FP%23Hxk6C9@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require'
  });
}
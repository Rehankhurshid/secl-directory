import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      DATABASE_URL: process.env.DATABASE_URL ? 'configured' : 'missing',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'configured' : 'missing',
      VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? 'configured' : 'missing',
      VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY ? 'configured' : 'missing',
    },
    checks: {
      database: process.env.DATABASE_URL ? 'ready' : 'not configured',
      authentication: process.env.NEXTAUTH_SECRET ? 'ready' : 'not configured',
      pushNotifications: process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? 'ready' : 'not configured',
    }
  });
}
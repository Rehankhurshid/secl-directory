#!/usr/bin/env node

console.log('=== Environment Check ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ Missing');
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✓ Set' : '✗ Missing');
console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY:', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? '✓ Set' : '✗ Missing');
console.log('VAPID_PRIVATE_KEY:', process.env.VAPID_PRIVATE_KEY ? '✓ Set' : '✗ Missing');

const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY'
];

const missing = requiredEnvVars.filter(v => !process.env[v]);

if (missing.length > 0) {
  console.error('\n❌ Missing required environment variables:', missing.join(', '));
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are set');
}
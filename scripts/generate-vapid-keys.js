const webpush = require("web-push");

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

console.log("🔑 VAPID Keys Generated:");
console.log("");
console.log("Add these to your .env.local file:");
console.log("");
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log("");
console.log("Also add your email for VAPID:");
console.log("VAPID_EMAIL=your-email@example.com");
console.log("");
console.log("✅ Copy these environment variables to your .env.local file");

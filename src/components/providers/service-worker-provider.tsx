"use client";

import { useEffect } from "react";
import { Workbox } from "workbox-window";

declare global {
  interface Window {
    workbox: any;
  }
}

export function ServiceWorkerProvider() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator
    ) {
      const wb = new Workbox("/sw.js");
      
      // Make workbox available globally for debugging
      window.workbox = wb;
      
      // Add event listeners to handle service worker lifecycle events
      wb.addEventListener("installed", (event) => {
        console.log("🚀 Service worker installed:", event);
      });

      wb.addEventListener("waiting", () => {
        // Show update prompt to user
        if (
          window.confirm(
            "A new version of the app is available. Would you like to update?"
          )
        ) {
          wb.addEventListener("controlling", () => {
            window.location.reload();
          });
          
          // Send skip waiting message to service worker
          wb.messageSkipWaiting();
        }
      });

      wb.addEventListener("activated", (event) => {
        console.log("✅ Service worker activated:", event);
      });

      wb.addEventListener("message", (event) => {
        console.log("📨 Service worker message:", event.data);
      });

      // Register the service worker
      wb.register()
        .then((registration) => {
          console.log("🎯 Service worker registered:", registration);
          
          // Initialize push notifications after SW is ready
          initializePushNotifications();
          
          // Check for updates every hour
          setInterval(() => {
            wb.update();
          }, 1000 * 60 * 60);
        })
        .catch((error) => {
          console.error("❌ Service worker registration failed:", error);
        });
    }

    // Handle offline/online events
    const handleOnline = () => {
      console.log("🌐 Back online");
      // Trigger background sync when back online
      if ("serviceWorker" in navigator && "sync" in window.ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((registration: any) => {
          return registration.sync.register("sync-messages");
        }).catch((error) => {
          console.error("❌ Background sync registration failed:", error);
        });
      }
    };

    const handleOffline = () => {
      console.log("📵 Gone offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return null;
}

// Initialize push notifications
async function initializePushNotifications() {
  try {
    // Wait a bit for SW to be fully ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!("Notification" in window) || !("PushManager" in window)) {
      console.warn("⚠️ Push notifications are not supported");
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    
    // Request permission on first visit
    if (Notification.permission === "default") {
      console.log("🔔 Requesting notification permission...");
      const permission = await Notification.requestPermission();
      console.log("📬 Notification permission:", permission);
      
      if (permission === "granted") {
        await subscribeToPushNotifications(registration);
      }
    } else if (Notification.permission === "granted") {
      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      if (!existingSubscription) {
        await subscribeToPushNotifications(registration);
      } else {
        console.log("✅ Already subscribed to push notifications");
      }
    }
  } catch (error) {
    console.error("❌ Failed to initialize push notifications:", error);
  }
}

// Subscribe to push notifications
async function subscribeToPushNotifications(registration: ServiceWorkerRegistration) {
  try {
    console.log("🔔 Starting push notification subscription process...");

    // Check if notifications are supported
    if (!('PushManager' in window)) {
      console.error("❌ Push messaging isn't supported");
      return;
    }

    // Get VAPID public key
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.error("❌ VAPID public key not configured");
      return;
    }

    // Request notification permission if not granted
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      console.log("❌ Notification permission denied");
      return;
    }

    console.log("✅ Notification permission granted");

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      console.log("📬 Creating new push subscription...");
      // Subscribe to push notifications
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      console.log("✅ Push subscription created:", subscription);
    } else {
      console.log("📬 Found existing push subscription:", subscription);
    }

    // Save subscription to server
    const token = localStorage.getItem("sessionToken");
    if (!token) {
      console.error("❌ No session token found for saving subscription");
      return;
    }

    console.log("💾 Saving push subscription to server...");
    
    // Format subscription data properly
    const subscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.getKey('p256dh') ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))) : '',
        auth: subscription.getKey('auth') ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))) : ''
      }
    };

    console.log("📤 Sending subscription data:", subscriptionData);

    const response = await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(subscriptionData),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log("✅ Push subscription saved successfully:", result);
    } else {
      console.error("❌ Failed to save push subscription:", result);
      console.error("Response status:", response.status);
    }
  } catch (error) {
    console.error("❌ Error in push subscription process:", error);
  }
}

// Convert VAPID key from base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Helper function to convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
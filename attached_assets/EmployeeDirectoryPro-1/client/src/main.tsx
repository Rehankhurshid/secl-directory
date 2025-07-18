import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful:', registration);
      })
      .catch(err => {
        console.log('ServiceWorker registration failed:', err);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);

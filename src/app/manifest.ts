import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SECL Messaging",
    short_name: "SECL Chat",
    description: "Secure employee communication and messaging platform",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff", 
    theme_color: "#000000",
    orientation: "portrait",
    scope: "/",
    icons: [
      {
        src: "/icon-72x72.png",
        sizes: "72x72",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-96x96.png",
        sizes: "96x96", 
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-128x128.png",
        sizes: "128x128",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-144x144.png",
        sizes: "144x144",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-152x152.png",
        sizes: "152x152",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-384x384.png",
        sizes: "384x384",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "New Message",
        short_name: "Message",
        description: "Start a new conversation",
        url: "/messaging",
        icons: [{ src: "/icon-96x96.png", sizes: "96x96" }],
      },
      {
        name: "Employee Directory",
        short_name: "Directory", 
        description: "Browse employee directory",
        url: "/employee-directory",
        icons: [{ src: "/icon-96x96.png", sizes: "96x96" }],
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
    categories: ["business", "productivity"],
    screenshots: [
      {
        src: "/screenshots/desktop-home.png",
        sizes: "1920x1080",
        type: "image/png",
      },
      {
        src: "/screenshots/mobile-home.png", 
        sizes: "750x1334",
        type: "image/png",
      },
    ],
  };
} 
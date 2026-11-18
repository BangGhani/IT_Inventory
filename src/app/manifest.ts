import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "IT Inventory — Bank Jatim",
    short_name: "IT Inventory",
    description:
      "Aplikasi inventaris dan manajemen IT untuk IT Support Bank Jatim",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#c4302b",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/app-logo.png",
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}

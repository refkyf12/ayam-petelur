import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Catatan Ayam Petelur",
    short_name: "Ayam Petelur",
    description: "Pencatatan produksi telur, biaya, HPP, dan penjualan",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f5f1",
    theme_color: "#256338",
    lang: "id",
    icons: [
      { src: "/ikon/192", sizes: "192x192", type: "image/png" },
      { src: "/ikon/512", sizes: "512x512", type: "image/png" },
      { src: "/ikon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

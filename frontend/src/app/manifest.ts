import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Layar Anime",
    short_name: "Layar Anime",
    description: "Jelajahi anime, jadwal tayang, genre, dan episode terbaru.",
    start_url: "/",
    display: "standalone",
    background_color: "#070b14",
    theme_color: "#070b14",
    icons: [
      {
        src: "/images/brand/layar-anime-icon.png",
        sizes: "1254x1254",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}

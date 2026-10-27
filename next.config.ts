import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // El prototipo no incluye configuración de ESLint; TypeScript sí se verifica en `next build`.
  eslint: { ignoreDuringBuilds: true },
  async redirects() {
    // La dirección anterior del panel sigue funcionando.
    return [{ source: "/admin-demo", destination: "/admin", permanent: false }];
  },
  images: {
    // Fotos locales en /public/images y fotos subidas al bucket público de Supabase Storage.
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;

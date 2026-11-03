import type { NextConfig } from "next";

// Solo se permite hablar con TU proyecto de Supabase (base de datos, funciones y fotos), no con cualquier *.supabase.co.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host : undefined;
const isDev = process.env.NODE_ENV !== "production";

const contentSecurityPolicy = [
  "default-src 'self'",
  // Next.js inyecta pequeños scripts en línea para arrancar; en desarrollo además necesita eval.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${supabaseHost ? ` https://${supabaseHost}` : ""}`,
  "font-src 'self' data:",
  `connect-src 'self'${supabaseHost ? ` https://${supabaseHost}` : ""}${isDev ? " ws: wss:" : ""}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      // La dirección anterior del panel sigue funcionando.
      { source: "/admin-demo", destination: "/admin", permanent: false },
      // Los navegadores piden /favicon.ico por costumbre; el ícono real es SVG.
      { source: "/favicon.ico", destination: "/icon.svg", permanent: false },
    ];
  },
  images: {
    // Fotos locales en /public/images y fotos subidas al bucket público de Supabase Storage de este proyecto.
    remotePatterns: supabaseHost ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }] : [],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;

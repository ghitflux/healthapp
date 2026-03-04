import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Cache Components — Next.js 16 (melhora TTFB de dados lentos no dashboard)
  // CRUDs mutáveis continuam em client components com React Query
  experimental: {
    // reactCompiler: true, // habilitar quando disponível stable
  },
  turbopack: {
    root: path.join(__dirname, '..'),
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/:path*`,
      },
    ];
  },
};

export default nextConfig;

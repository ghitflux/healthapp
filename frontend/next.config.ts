import type { NextConfig } from 'next';
import path from 'path';

const turbopackReactQueryAlias = {
  '@tanstack/react-query': 'frontend/node_modules/@tanstack/react-query',
  '@tanstack/query-core': 'frontend/node_modules/@tanstack/query-core',
  '@tanstack/react-query-devtools': 'frontend/node_modules/@tanstack/react-query-devtools',
};

const webpackReactQueryAlias = {
  '@tanstack/react-query': path.join(__dirname, 'node_modules', '@tanstack', 'react-query'),
  '@tanstack/query-core': path.join(__dirname, 'node_modules', '@tanstack', 'query-core'),
  '@tanstack/react-query-devtools': path.join(
    __dirname,
    'node_modules',
    '@tanstack',
    'react-query-devtools'
  ),
};

const nextConfig: NextConfig = {
  experimental: {
    // reactCompiler: true, // habilitar quando disponível stable
  },
  turbopack: {
    // Raiz do monorepo: permite Turbopack resolver shared/gen/ fora de frontend/
    // e evita dual-instance de react-query entre frontend/ e raiz.
    root: path.join(__dirname, '..'),
    resolveAlias: turbopackReactQueryAlias,
  },
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      ...webpackReactQueryAlias,
    };
    return config;
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

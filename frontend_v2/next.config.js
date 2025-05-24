/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'example.com', 'images.unsplash.com', 'localhost:8000', 'unl-events.duckdns.org'], // Домены для изображений
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'unl-events.duckdns.org',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig; 
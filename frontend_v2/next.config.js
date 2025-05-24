/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['unl-events.duckdns.org'], // Убираем localhost и оставляем только production домен
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'unl-events.duckdns.org',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig; 
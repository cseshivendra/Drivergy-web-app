/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.canva.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https' ,
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'rukminim1.flixcart.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'rukminim2.flixcart.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'rukminim3.flixcart.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'rukminim4.flixcart.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'rukminim5.flixcart.com',
        pathname: '/**',
      },
    ],
  },
  serverExternalPackages: ['@genkit-ai/core', 'genkit'],
};

module.exports = nextConfig;

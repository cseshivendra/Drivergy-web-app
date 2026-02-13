
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
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.canva.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https' ,
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'rukminim1.flixcart.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'rukminim2.flixcart.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'rukminim3.flixcart.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'rukminim4.flixcart.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'rukminim5.flixcart.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  serverExternalPackages: ['@genkit-ai/core', 'genkit'],
};

module.exports = nextConfig;

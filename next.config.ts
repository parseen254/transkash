import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    '*.cloudworkstations.dev',
    '*.hosted.app',
    '*.github.dev'
  ],
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
    ],
  },
  experimental: {
    serverActions:{
      allowedOrigins: [
        'expert-enigma-wr657wp97vpf5p5p-9002.app.github.dev',
        'localhost:9002'
      ]
    }
  }
};

export default nextConfig;

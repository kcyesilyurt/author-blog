import type { NextConfig } from "next";

const supabaseHostname = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : null;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/kitaplarim',
        destination: '/#kitaplarim',
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      ...(supabaseHostname
        ? [{ protocol: 'https' as const, hostname: supabaseHostname, pathname: '/storage/v1/object/public/**' }]
        : []),
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;

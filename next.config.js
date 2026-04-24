/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Supabase storage
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
      // Unsplash
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Allow ANY external hostname for charity images
      // (admins upload images from various charity websites)
      { protocol: 'https', hostname: '**' },
      { protocol: 'http',  hostname: '**' },
    ],
  },
}

module.exports = nextConfig
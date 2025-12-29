/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Static SPA export - generates static files in 'out/' directory
  output: 'export',
  // Trailing slashes ensure proper static file serving
  trailingSlash: true,
}

export default nextConfig

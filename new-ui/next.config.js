/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export to new-ui/out — the Express server serves this directory from
  // the same origin as the API, so the UI's "/api/*" calls need no CORS.
  output: 'export',
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig

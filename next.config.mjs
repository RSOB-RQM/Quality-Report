Code block - javascript

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    '/api/dashboard': ['./data/**'],
    '/api/upload': ['./data/**'],
    '/api/rawdata': ['./data/**'],
  },
};

export default nextConfig;

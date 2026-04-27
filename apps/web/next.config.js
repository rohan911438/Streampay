const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");

module.exports = (phase) => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;

  /** @type {import('next').NextConfig} */
  const nextConfig = {
    reactStrictMode: true,
    // Keep dev and production outputs isolated to avoid stale-chunk 404s.
    distDir: isDev ? ".next-dev" : ".next",
    webpack: (config, { isServer }) => {
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          os: false,
          path: false,
          crypto: false,
          stream: false,
          http: false,
          https: false,
          zlib: false,
        };
      }
      return config;
    },
  };

  return nextConfig;
};

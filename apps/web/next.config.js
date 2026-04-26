/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        process: false,
        zlib: false,
        stream: false,
        util: false,
        buffer: false,
        asset: false,
      };
      
      const webpack = require('webpack');
      config.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser',
        })
      );
    }
    return config;
  },
};

module.exports = nextConfig;

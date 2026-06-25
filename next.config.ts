import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Core optimizations to prevent CPU overheating and memory leaks */
  experimental: {
    // Avoid preloading all pages into memory at start, reducing initial footprint
    preloadEntriesOnStart: false,
  },
  turbopack: {
    // Silence custom Webpack configuration checker by declaring an empty Turbopack key
  },
  webpack: (config, { dev }) => {
    // Reduce Webpack memory usage in development mode
    if (dev && config.cache) {
      config.cache = {
        type: 'memory',
        maxGenerations: 5,
      };
    }
    return config;
  },
};

export default nextConfig;

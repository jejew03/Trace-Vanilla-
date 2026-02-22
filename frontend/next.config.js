/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("hashconnect", "@hashgraph/hedera-wallet-connect");
    }
    config.ignoreWarnings = [
      { module: /node_modules\/@hashgraph\/hedera-wallet-connect/ },
    ];
    return config;
  },
};

module.exports = nextConfig;

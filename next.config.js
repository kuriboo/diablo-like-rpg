/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    webpack: (config, { isServer }) => {
      // Phaserと関連ライブラリの設定
      config.module.rules.push({
        test: /\.(glsl|vs|fs|vert|frag)$/,
        exclude: /node_modules/,
        use: ['raw-loader']
      });
  
      // Node.js関連のポリフィルを追加
      if (!isServer) {
        config.resolve.fallback = {
          fs: false,
          path: false,
          crypto: false
        };
      }
  
      return config;
    },
    // 静的アセットの設定
    images: {
      disableStaticImages: true,
    },
};
  
module.exports = nextConfig;
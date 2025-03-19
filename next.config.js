/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    webpack: (config, { isServer }) => {
      if (isServer) {
        // サーバーサイドビルド時のモジュール置き換え設定
        config.resolve.alias['phaser'] = false;
      }

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
    distDir: 'out',
    // 静的アセットの設定
    images: {
      unoptimized: true,
      disableStaticImages: true,
    },
    output: 'export',
};
  
module.exports = nextConfig;
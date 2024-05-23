const webpack = require('webpack');
const path = require('path');
const GoogleFontsPlugin = require('@beyonk/google-fonts-webpack-plugin');

module.exports = {
  entry: './src/js/index.js',
  devServer: {
    watchFiles: ['src/*.html'],
    static: {
      directory: path.join(__dirname, 'build'),
    },
    client: {
      logging: 'info',
      webSocketURL: 'ws://localhost:9000/ws',
      webSocketTransport: 'ws',
    },
    webSocketServer: 'ws',
    hot: false,
    port: 9000,
    compress: true,
  },
  plugins: [
    new GoogleFontsPlugin({
      fonts: [{ family: 'Manrope', variants: ['400', '600', '700', '800'] }],

      // Add more fonts if needed
      local: false, // Use Google fonts CDN instead of downloading
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(svg|jpg|png)$/,
        type: 'asset/resource',
      },
    ],
  },
};

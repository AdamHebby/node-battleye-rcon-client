const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');

module.exports = {
  cache: false,
  mode: "development",
  devtool: "inline-source-map",
  entry: {
    index: "./src/index.ts"
  },
  output: {
    path: path.resolve(__dirname, './build'),
    filename: "[name].js" // <--- Will be compiled to this single file
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  optimization: {
    concatenateModules: true,
    minimize: true,
  },
  watchOptions: {
    aggregateTimeout: 200,
    poll: 1000,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/pages/invite.html',
      filename: 'pages/invite.html',
      chunks: ['invite'],
      inject: false
    }),
    new HtmlWebpackPlugin({
      template: 'src/pages/login.html',
      filename: 'pages/login.html',

      chunks: ['login'],
      inject: false
    }),
    new HtmlWebpackPlugin ({
      inject: true,
      template: 'src/pages/index.html',
      filename: 'pages/index.html',
      excludeChunks: ['server', 'login', 'invite']
    }),
    new HtmlInlineScriptPlugin({
      compress: true
    }),
  ]
};


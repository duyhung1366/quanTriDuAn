const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin")
const Dotenv = require("dotenv-webpack")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const { CleanWebpackPlugin } = require("clean-webpack-plugin")
const CompressionPlugin = require("compression-webpack-plugin")
const CopyPlugin = require("copy-webpack-plugin");
const fs = require("fs/promises");
const dotenv = require("dotenv");


/**
 * @returns {import("webpack").Configuration}
 */
module.exports = async (env, argv) => {
  const isDev = argv.mode === "development";
  dotenv.config({ path: `./.env.${argv.mode}` });
  const dataDir = await fs.readdir(path.resolve("public"));
  const copyPluginsPattern = dataDir
    .filter((src) => src !== "index.html")
    .map((src) => ({
      from: path.resolve("public", src),
      to: src
    }));

  const basePlugins = [
    new MiniCssExtractPlugin({
      filename: isDev ? "css/site.css" : "static/css/site.min.css"
    }),
    new HtmlWebpackPlugin({
      favicon: "public/favicon.ico",
      template: "public/index.html"
    }),
    new CopyPlugin({ patterns: copyPluginsPattern }),
    new webpack.ProgressPlugin()
  ];

  const devPlugins = [
    ...basePlugins,
    new Dotenv({ path: path.resolve(__dirname, "./.env.development"), safe: false })
  ];

  const prodPlugins = [
    ...basePlugins,
    new Dotenv({ path: path.resolve(__dirname, "./.env.production"), safe: true }),
    new CleanWebpackPlugin(),
    new CompressionPlugin({
      test: /\.(css|js|html|svg)$/
    }),
    new webpack.DefinePlugin({
      'process.env.PUBLIC_URL': JSON.stringify(process.env.PUBLIC_URL)
    })
  ]

  return {
    entry: [
      "./src/index.tsx"
    ],
    output: {
      publicPath: isDev ? "/" : (process.env.PUBLIC_URL || "/"),
      filename: "index.bundle.js",
      path: path.resolve(__dirname, "dist"),
      library: "KsTeam",
      chunkFilename: "chunks/[name].[chunkhash].js"
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx|js|jsx)$/,
          use: [
            {
              loader: "ts-loader",
              options: {
                transpileOnly: true
              }
            }
          ],
          exclude: /node_modules/
        },
        {
          test: /\.(s[ac]ss|css)$/,
          use: [
            MiniCssExtractPlugin.loader,
            "css-loader",
            "sass-loader"
          ]
        },
        {
          test: /\.(eot|ttf|woff|woff2)$/,
          type: "asset/resource"
        },
        {
          test: /\.(png|svg|jpg|gif)$/,
          use: [
            {
              loader: "file-loader",
              options: {
                name: isDev
                  ? "[path][name].[ext]"
                  : "static/media/[name].[contenthash:6].[ext]"
              }
            }
          ]
        },
        {
          test: /\.svg$/,
          use: [
            {
              loader: "svg-url-loader",
              options: {
                limit: 10000
              }
            }
          ]
        },
        {
          test: /\.mp3$/,
          use: [
            {
              loader: "file-loader",
              options: {
                name: "static/media/[name].[hash:8].[ext]"
              }
            }
          ]
        }
      ]
    },
    resolve: {
      extensions: [".tsx", ".ts", ".jsx", ".js"],
      alias: {
        "@": path.resolve("src"),
        "@@": path.resolve()
      },
      fallback: {
        crypto: false
      }
    },
    devtool: isDev ? "source-map" : false,
    devServer: {
      static: {
        directory: path.join(__dirname, "public/")
      },
      port: 3000,
      compress: true,
      historyApiFallback: true
    },
    plugins: isDev ? devPlugins : prodPlugins,
    performance: {
      maxEntrypointSize: 800000
    }
  }
}

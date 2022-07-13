const path = require("path");
const autoprefixer = require("autoprefixer");

module.exports = {
  entry: {
    index: "./src/index.js",
    "projects/index": "./src/pages/projects/index.js",
    "project/index": "./src/pages/project/index.js",
    "login/index": "./src/pages/login/index.js",
    "registration/index": "./src/pages/registration/index.js",
    "editor/index": "./src/pages/editor/index.js",
  },
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "static/dist"),
    clean: true,
  },
  optimization: {
    usedExports: "global",
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              [
                "@babel/preset-env",
                {
                  targets: "defaults",
                },
              ],
            ],
          },
        },
      },
      {
        test: /\.css$/,
        exclude: /node_modules/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.scss$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "bundle.css",
            },
          },
          { loader: "extract-loader" },
          { loader: "css-loader" },
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [autoprefixer()],
              },
            },
          },
          {
            loader: "sass-loader",
            options: {
              // Prefer Dart Sass
              implementation: require("sass"),

              // See https://github.com/webpack-contrib/sass-loader/issues/804
              webpackImporter: false,
              sassOptions: {
                includePaths: ["./node_modules"],
              },
            },
          },
        ],
      },
    ],
  },
};

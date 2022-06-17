const path = require('path');
const autoprefixer = require('autoprefixer');

module.exports = {
  entry: {
    index: './src/index.js',
    projects: './src/projects.js',
    login: './src/login.js',
    registration: './src/registration.js',
    add_edit_project: './src/add_edit_project.js',
    editor: './src/editor.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'static/js'),
    clean: true,
  },
  optimization: {
    usedExports: 'global',
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: "defaults" }]
            ]
          }
        }
      },
      {
        test: /\.scss$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'bundle.css',
              outputPath: '../'
            },
          },
          { loader: 'extract-loader' },
          { loader: 'css-loader' },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  autoprefixer()
                ]
              }
            } 
          },
          {
            loader: 'sass-loader',
            options: {
              // Prefer Dart Sass
              implementation: require('sass'),

              // See https://github.com/webpack-contrib/sass-loader/issues/804
              webpackImporter: false,
              sassOptions: {
                includePaths: ['./node_modules']
              },
            },
          },
        ]
      }
    ]
  }
};

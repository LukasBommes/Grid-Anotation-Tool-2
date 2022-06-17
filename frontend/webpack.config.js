const path = require('path');

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
      }
    ]
  }
};

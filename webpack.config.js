const webpack = require('webpack');
module.exports = {
  entry: {
    background:      './src/background.js',
    popup:           './src/popup.jsx',
    sidebar:         './src/sidebar.jsx',
    content_scripts: './src/content_script.js',
  },
  output: {
    path:     `${__dirname}/`,
    filename: '[name]/bundle.js',
  },
  module: {
    rules: [
      { test: /\.css$/, use: 'css-loader' },
      { test: /\.jsx?$/, use: 'babel-loader', exclude: /(node_modules|bower_components)/ },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV:      JSON.stringify('production'),
        BASE_URL:      JSON.stringify(process.env.BASE_URL),
        CLIENT_ID:     JSON.stringify(process.env.CLIENT_ID),
        CLIENT_SECRET: JSON.stringify(process.env.CLIENT_SECRET),
        SYNC_INTERVAL: JSON.stringify(process.env.SYNC_INTERVAL),
        DATABASE_NAME: JSON.stringify(process.env.DATABASE_NAME),
      },
    }),
  ],
  devtool: 'source-map',
};

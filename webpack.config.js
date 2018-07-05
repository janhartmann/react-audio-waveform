const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const sourceDirectory = path.resolve(__dirname, "example");

module.exports = {
  target: "web",
  context: sourceDirectory,
  entry: {
    app: ["./index.js"]
  },
  output: {
    path: path.resolve(__dirname, "./dist"),
    publicPath: "/",
    filename: "[name].bundle.js"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        loader: "babel-loader"
      },
      {
        test: /\.(wav|ttf|eot|svg|woff(2)?)(\?[a-z0-9=&.]+)?$/,
        exclude: /node_modules/,
        use: "file-loader?name=assets/[name].[ext]"
      }
    ]
  },
  plugins: [
    new webpack.NamedModulesPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "/example/index.html")
    })
  ],
  resolve: {
    extensions: [".mjs", ".js", ".json", ".jsx"],
    alias: {
      "react-audio-waveform": path.resolve(__dirname, "src/index")
    }
  },
  devServer: {
    historyApiFallback: true,
    contentBase: sourceDirectory,
    host: "0.0.0.0",
    port: 3001,
    hot: true,
    headers: { "Access-Control-Allow-Origin": "*" }
  }
};

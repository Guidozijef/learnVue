const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
    mode: 'development',
    entry: path.resolve(__dirname, 'src/main.js'),
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'main.js'
    },
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: 'vue-loader'
            }
        ]
    },
    resolveLoader: {
        modules: [path.resolve(__dirname, 'modules'), 'node_modules'],
        extensions: ['.vue', '.js']
    },
    resolve: {
        extensions: ['.vue', '.js'],
        modules: [path.resolve(__dirname, 'modules'), 'node_modules']
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'index.html'
        })
    ]



}
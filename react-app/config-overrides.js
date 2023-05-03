const webpack = require("webpack")

module.exports = function override(config, env) {
    // New config, e.g. config.plugins.push...

    let config_new = config

    config_new.plugins.push(new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
    }))

    config_new.resolve = {
        extensions: [ '.ts', '.js', '.tsx', '.jsx' ],
        fallback: {
            "stream": require.resolve("stream-browserify"),
            "url": require.resolve("url/"),
            "zlib": require.resolve("browserify-zlib"),
            "https": require.resolve("https-browserify"),
            "http": require.resolve("stream-http"),
            "buffer": require.resolve("buffer/"),
            "crypto": require.resolve("crypto-browserify")
        }
    }
    
    return config_new
}
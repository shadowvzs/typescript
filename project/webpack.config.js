const resolveTsconfigPathsToAlias = require('./resolve-tsconfig-path-to-webpack-alias');

module.exports = {
    entry: [
        './src/index.tsx'
    ],
    output: {
        path: __dirname,
        publicPath: '/',
        filename: 'bundle.js'
    },
    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",
    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", ".js", ".json"],
        alias: resolveTsconfigPathsToAlias({
            tsconfigPath: './tsconfig.json', // Using custom path
            webpackConfigBasePath: './src', // Using custom path         
        }),
    },
    watch: true,
    watchOptions: {
        aggregateTimeout: 600,
        poll: 2000,
        ignored: [
            'api',
            'backup',
            'node_modules',
            'test',
            'v8-compile-cache-0',
        ]
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: "/node_modules/",
                loader: "awesome-typescript-loader",
            },
            {
                test: /\.m?js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.(png|jpg|jpeg|gif|svg)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            name:'[name][hash].[ext]',
                            outputPath: 'src/assets/loader/img',
                            limit: 8192
                        }
                    }
                ]
            },
            {
                test: /\.(woff|ttf)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name:'[name][hash].[ext]',
                            outputPath: 'src/assets/loader/font',
                            limit: 8192
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        // new webpack.DefinePlugin(globalDefinitions)
    ]
};
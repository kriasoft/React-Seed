/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import WriteFilePlugin from 'write-file-webpack-plugin';
import express from 'express';
import proxy from 'http-proxy-middleware';
import run from './run';
import runServer from './runServer';
import webpackConfig from './webpack.config';
import clean from './clean';
import copy from './copy';
import { port, host } from '../src/config';

const isDebug = !process.argv.includes('--release');
process.argv.push('--watch');

const [clientConfig, serverConfig] = webpackConfig;

const proxyPort = port + 1;

/**
 * Launches a development web server with "live reload" functionality -
 * synchronizing URLs, interactions and code changes across multiple devices.
 */
async function start() {
  await run(clean);
  await run(copy);
  await new Promise((resolve, reject) => {
    // Save the server-side bundle files to the file system after compilation
    // https://github.com/webpack/webpack-dev-server/issues/62
    serverConfig.plugins.push(new WriteFilePlugin({ log: false }));

    // Hot Module Replacement (HMR) + React Hot Reload
    if (isDebug) {
      clientConfig.entry.client = [...new Set([
        'babel-polyfill',
        'react-hot-loader/patch',
        'webpack-hot-middleware/client',
      ].concat(clientConfig.entry.client))];
      clientConfig.output.filename = clientConfig.output.filename.replace('[chunkhash', '[hash');
      clientConfig.output.chunkFilename = clientConfig.output.chunkFilename.replace('[chunkhash', '[hash');
      const { query } = clientConfig.module.rules.find(x => x.loader === 'babel-loader');
      query.plugins = ['react-hot-loader/babel'].concat(query.plugins || []);
      clientConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
      clientConfig.plugins.push(new webpack.NoEmitOnErrorsPlugin());
    }

    const bundler = webpack(webpackConfig);
    const wpMiddleware = webpackDevMiddleware(bundler, {
      // IMPORTANT: webpack middleware can't access config,
      // so we should provide publicPath by ourselves
      publicPath: clientConfig.output.publicPath,

      // Pretty colored output
      stats: clientConfig.stats,

      // For other settings see
      // https://webpack.github.io/docs/webpack-dev-middleware
    });
    const hotMiddleware = webpackHotMiddleware(bundler.compilers[0]);

    let handleBundleComplete = async () => {
      handleBundleComplete = stats => !stats.stats[1].compilation.errors.length && runServer();

      await runServer();
      const app = express();
      app.all('*', wpMiddleware, hotMiddleware, proxy(`http://${host}`));
      app.listen(proxyPort, err => (err ? reject(err) : resolve(err)));
    };

    bundler.plugin('done', stats => handleBundleComplete(stats));
  });
  console.log('\x1b[35m', `Open http://localhost:${proxyPort}`, '\x1b[0m');
}

export default start;

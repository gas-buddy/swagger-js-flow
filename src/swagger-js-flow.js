#!/usr/bin/env node
/* eslint-disable no-console */
import fs from 'fs';
import _ from 'lodash';
import path from 'path';
import mkdirp from 'mkdirp';
import confit from 'confit';
import minimist from 'minimist';
import handlers from 'shortstop-handlers';
import swaggerFlow from './index';

const argv = minimist(process.argv.slice(2), {
  alias: {
    o: 'output',
    c: 'confit',
    n: 'name',
    q: 'quiet',
    p: 'confitPath',
  },
  default: {
    confitPath: 'connections:services:specs',
  },
  boolean: ['quiet'],
});

async function run() {
  const specs = {};
  if (argv.confit) {
    await new Promise((accept, reject) => {
      const baseRequire = handlers.require(argv.confit);
      confit({
        basedir: path.resolve(argv.confit),
        protocols: {
          require: (v) => {
            try {
              return baseRequire(v);
            } catch (e) {
              return null;
            }
          },
        },
      }).create((err, config) => {
        if (err) {
          reject(err);
        } else {
          for (const [configName, module] of Object.entries(config.get(argv.confitPath))) {
            if (!module) {
              throw new Error(`Could not find module specified by ${configName}`);
            }
            const clientName = `${_.upperFirst(_.camelCase(configName))}Client`;
            if (!argv.quiet) {
              console.log('Producing flow type', clientName, 'for confit entry', configName);
            }
            specs[clientName] = module;
          }
          accept();
        }
      });
    });
  } else if (argv._ && argv._.length) {
    for (let i = 0; i < argv._.length; i += 1) {
      const names = argv.name ? argv.name.split(',') : null;
      if (names && names[i]) {
        if (!argv.quiet) {
          console.log('Producing flow type', names[i], 'for', argv._[i]);
        }
        const specPath = argv._[i][0] === '.' ? path.resolve(argv._[i]) : argv._[i];
        // eslint-disable-next-line global-require, import/no-dynamic-require
        specs[names[i]] = require(specPath);
      } else {
        console.error('Missing client type name (pass with --name=a,b,c) for', argv._[i]);
      }
    }
  }

  if (argv.output) {
    mkdirp.sync(path.resolve(argv.output));
  }

  await Object.entries(specs).reduce((previous, [clientName, swaggerSource]) =>
    previous.then(async () => {
      const flow = await swaggerFlow({
        name: clientName,
        spec: swaggerSource,
      });
      if (argv.output) {
        const ext = argv.ext || '.js';
        fs.writeFileSync(path.join(argv.output, `${clientName}${ext}`), flow);
      } else {
        console.log(flow);
      }
    }), Promise.resolve(0));
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(-1);
  });

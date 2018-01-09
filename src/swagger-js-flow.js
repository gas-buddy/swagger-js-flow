#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import swaggerFlow from './index';

const [name, spec, output] = process.argv.slice(2);

const swaggerSource = JSON.parse(fs.readFileSync(spec));

swaggerFlow({
  spec: swaggerSource,
  name,
})
  .then((flow) => {
    if (output) {
      fs.writeFileSync(output, flow);
    } else {
      console.log(flow);
    }
  })
  .catch(console.error);

#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import swaggerFlow from './index';

const [name, spec] = process.argv.slice(2);

const swaggerSource = JSON.parse(fs.readFileSync(spec));

swaggerFlow({
  spec: swaggerSource,
  name,
})
  .then(flow => console.log(flow))
  .catch(console.error);

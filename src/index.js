import _ from 'lodash';
import assert from 'assert';
import Client from 'swagger-client';

const typeMap = {
  integer: 'number',
  number: 'number',
  string: 'string',
  boolean: 'boolean',
  object: 'object',
  any: 'any',
};

const preamble = `// @flow

class SwaggerResponse<T> {
  obj: T;
  status: number;
  headers: Object;
};
`;

function apis(client, fn) {
  for (const [tag, { operations }] of Object.entries(client.apis)) {
    if (operations) {
      fn(tag, operations);
    }
  }
}

function ident(v) {
  return _.snakeCase(v.replace(/\s+/g, '_')).toUpperCase();
}

function flowType(def) {
  if (def.$ref) {
    return def.$ref.split('/').slice(-1);
  }
  if (def.type === 'array') {
    return `Array<${flowType(def.items)}>`;
  }
  if (!typeMap[def.type]) {
    // eslint-disable-next-line no-console
    console.error('Unknown type (using "any"):', def.type);
  }
  return typeMap[def.type] || 'any';
}

export default async function generateFlowTypes({ spec, name }) {
  const lines = [preamble];

  const client = await new Client({
    spec,
    usePromise: true,
  });

  // Generate model classes
  for (const [modelName, model] of Object.entries(client.models || {})) {
    if (model.isArray) {
      lines.push(`type ${modelName} = Array<${flowType(model.definition.items)}>;\n`);
    } else if (model.definition.type === 'string') {
      // Assume it's an enum
      assert(model.definition.enum, `Expected ${modelName} to be an enumerated value`);
      lines.push(`export const ${modelName} = {`);
      model.definition.enum.forEach(v => lines.push(`  ${ident(v)}: '${v}',`));
      lines.push('}');
      lines.push(`type ${modelName}Enum = $Values<typeof ${modelName}>;\n`);
    } else {
      lines.push(`interface ${modelName} {`);
      for (const [prop, def] of Object.entries(model.definition.properties || {})) {
        lines.push(`  ${prop}: ${flowType(def)};`);
      }
      lines.push('}\n');
    }
  }

  // Generate interfaces for all the tags
  apis(client, (tag, operations) => {
    lines.push(`interface ${name}_${tag} {`);
    for (const [methodName, details] of Object.entries(operations || {})) {
      let respType = { type: 'any' };
      if (details.successResponse) {
        respType = Object.values(details.successResponse)[0].definition;
      }
      lines.push(`  /* ${details.description || 'no description'} */`);
      lines.push(`  ${methodName}() : SwaggerResponse<${flowType(respType)}>;\n`);
    }
    lines.push('}\n');
  });

  lines.push(`export interface ${name} {`);
  // Generate all the tags
  apis(client, (tag) => {
    lines.push(`  ${tag}: ${name}_${tag};`);
  });
  lines.push('}\n');
  return lines.join('\n');
}

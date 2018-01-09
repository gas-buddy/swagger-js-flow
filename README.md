swagger-js-flow
===============

[![wercker status](https://app.wercker.com/status/ec4cc823e7a4bc1a6662fac1f3ff6aaf/s/master "wercker status")](https://app.wercker.com/project/byKey/ec4cc823e7a4bc1a6662fac1f3ff6aaf)

A module that converts a swagger JSON file into flow types for use with the dynamic swagger-js client. This is mostly used in the GasBuddy service framework, and thus includes a mode to read services from a config directory. It can also just take a JSON spec filename or a module whose main export is a JSON swagger spec.

Typically, you place this script in a postinstall step of your service, so that whenever your specs (may have) changed, you regenerate the type definitions.
Because flow doesn't seem to play nice with node_modules and VSCode autocomplete, we don't ship flow types with service definitions. Probably would be nice to
figure out if that's our fault or someone elses.

```
  "postinstall": "swagger-js-flow --confit=./config --output=flow-typed/services"
```

Or if you want to be a little more frugal:

```
  "postinstall": "[ \"$NODE_ENV\" = development ] && swagger-js-flow --confit=./config --output=flow-typed/services"
```
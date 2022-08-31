import Ajv from "ajv";
// @ts-ignore
import specs from '@asyncapi/specs';

import type { ErrorObject, ValidateFunction } from "ajv";
import type { AsyncAPISchema, SchemaValidateResult } from '../types';
import type { SchemaParser, ParseSchemaInput, ValidateSchemaInput } from "../schema-parser";

const ajv = new Ajv({
  allErrors: true,
  strict: false,
  logger: false,
});
// Only versions compatible with JSON Schema Draf-07 are supported.
const specVersions = Object.keys(specs).filter((version: string) => !['1.0.0', '1.1.0', '1.2.0', '2.0.0-rc1', '2.0.0-rc2'].includes(version));

export function AsyncAPISchemaParser(): SchemaParser {
  return {
    validate,
    parse,
    getMimeTypes,
  }
}

async function validate(input: ValidateSchemaInput<unknown, unknown>): Promise<SchemaValidateResult[]> {
  const version = input.asyncapi.semver.version
  const validator = getSchemaValidator(version);

  let result: SchemaValidateResult[] = []
  const valid = validator(input.data);
  if (!valid && validator.errors) {
    result = ajvToSpectralResult([...validator.errors]);
  }

  return result;
}

async function parse(input: ParseSchemaInput<unknown, unknown>): Promise<AsyncAPISchema> {
  return input.data as AsyncAPISchema;
}

function getMimeTypes() {
  const mimeTypes = [
    'application/schema;version=draft-07',
    'application/schema+json;version=draft-07',
    'application/schema+yaml;version=draft-07',
  ];

  specVersions.forEach((version: string) => {
    mimeTypes.push(
      `application/vnd.aai.asyncapi;version=${version}`,
      `application/vnd.aai.asyncapi+json;version=${version}`,
      `application/vnd.aai.asyncapi+yaml;version=${version}`,
    );
  });
  return mimeTypes;
}

function ajvToSpectralResult(errors: ErrorObject[]): SchemaValidateResult[] {
  return errors.map(error => {
    return {
      message: error.message,
      path: error.instancePath.replace(/^\//, '').split('/'),
    } as SchemaValidateResult;
  });
}

function getSchemaValidator(version: string): ValidateFunction {
  let validator = ajv.getSchema(version);
  if (!validator) {
    const schema = preparePayloadSchema(specs[version], version);

    ajv.addSchema(schema, version);
    validator = ajv.getSchema(version);
  }

  return validator as ValidateFunction;
}

/**
 * To validate the schema of the payload we just need a small portion of official AsyncAPI spec JSON Schema, the Schema Object in particular. The definition of Schema Object must be
 * included in the returned JSON Schema.
 */
function preparePayloadSchema(asyncapiSchema: AsyncAPISchema, version: string): AsyncAPISchema {
  const payloadSchema = `http://asyncapi.com/definitions/${version}/schema.json`;
  const definitions = asyncapiSchema.definitions;
  if (definitions === undefined) {
    throw new Error("AsyncAPI schema must contain definitions");
  }

  // Remove the meta schemas because they are already present within Ajv, and it's not possible to add duplicated schemas.
  delete definitions['http://json-schema.org/draft-07/schema'];
  delete definitions['http://json-schema.org/draft-04/schema'];
  
  return {
    $ref: payloadSchema,
    definitions
  };
}
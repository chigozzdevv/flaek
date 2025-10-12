import Ajv, { ValidateFunction } from 'ajv';

const ajv = new Ajv({ allErrors: true, coerceTypes: true, removeAdditional: false });
const cache = new Map<string, ValidateFunction>();

export function compileValidator(schema: any, key?: string): ValidateFunction {
  const cacheKey = key || JSON.stringify(schema);
  const existing = cache.get(cacheKey);
  if (existing) return existing;
  const fn = ajv.compile(schema);
  cache.set(cacheKey, fn);
  return fn;
}


import { getCompDefAccOffset } from '@arcium-hq/client';

export interface CircuitMapping {
  name: string;
  compDefOffset: number;
}

export function getCircuitOffset(circuitName: string): number {
  try {
    const offset = getCompDefAccOffset(circuitName);
    return Buffer.from(offset).readUInt32LE(0);
  } catch (error) {
    throw new Error(`Circuit '${circuitName}' not found. Has it been deployed?`);
  }
}

export const CIRCUIT_MAPPINGS: Record<string, string> = {
  'add': 'add',
  'subtract': 'subtract',
  'multiply': 'multiply',
  'divide': 'divide',
  'modulo': 'modulo',
  'power': 'power',
  'greater_than': 'greater_than',
  'less_than': 'less_than',
  'equal': 'equal',
  'greater_equal': 'greater_equal',
  'less_equal': 'less_equal',
  'in_range': 'in_range',
  'and': 'and',
  'or': 'or',
  'not': 'not',
  'xor': 'xor',
  'if_else': 'if_else',
  'average': 'average',
  'sum': 'sum',
  'min': 'min',
  'max': 'max',
  'median': 'median',
  'credit_score': 'credit_score',
  'health_risk': 'health_risk',
  'vote_tally': 'vote_tally',
  'meets_threshold': 'meets_threshold',
  'weighted_average': 'weighted_average',
};

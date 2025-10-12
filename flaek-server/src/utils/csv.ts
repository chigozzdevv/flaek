import { parse } from 'csv-parse/sync';

export function parseCsvToObjects(body: string): Record<string, any>[] {
  const records = parse(body, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  return records as Record<string, any>[];
}


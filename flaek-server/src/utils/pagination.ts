export function parsePagination(limit?: any, cursor?: any) {
  const l = Math.min(Math.max(parseInt(limit ?? '20', 10) || 20, 1), 100);
  const c = typeof cursor === 'string' ? cursor : undefined;
  return { limit: l, cursor: c };
}


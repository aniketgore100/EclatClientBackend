export interface Paginated<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}

export function parsePagination(query: Record<string, unknown>, defaultLimit = 24, maxLimit = 100) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number(query.limit) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

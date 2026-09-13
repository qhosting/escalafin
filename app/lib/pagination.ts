/** Reject malformed and unbounded pagination before querying the database. */
export function parsePagination(params: URLSearchParams, defaultLimit = 20) {
  const page = Number(params.get('page') ?? 1);
  const limit = Number(params.get('limit') ?? defaultLimit);
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000 ||
      !Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    throw new RangeError('page debe ser un entero entre 1 y 100000 y limit entre 1 y 100');
  }
  return { page, limit, skip: (page - 1) * limit };
}

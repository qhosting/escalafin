import { parsePagination } from '@/lib/pagination';

describe('parsePagination', () => {
  it('applies safe defaults', () => {
    expect(parsePagination(new URLSearchParams())).toEqual({ page: 1, limit: 20, skip: 0 });
  });
  it('rejects unbounded or malformed values', () => {
    expect(() => parsePagination(new URLSearchParams('limit=1000'))).toThrow(RangeError);
    expect(() => parsePagination(new URLSearchParams('page=abc'))).toThrow(RangeError);
  });
});

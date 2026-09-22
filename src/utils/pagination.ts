// src/utils/pagination.ts
// Parses and validates page/limit query params.

export interface ParsedPagination {
  page: number;
  limit: number;
  skip: number;
}

export function parsePagination(
  pageStr?: string,
  limitStr?: string,
  maxLimit = 100
): ParsedPagination {
  let page = parseInt(pageStr ?? '1', 10);
  let limit = parseInt(limitStr ?? '50', 10);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 50;
  if (limit > maxLimit) limit = maxLimit;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

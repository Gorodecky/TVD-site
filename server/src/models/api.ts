export interface ApiError extends Error {
  statusCode?: number;
  details?: unknown;
}

export interface PageQuery {
  page: number;
  pageSize: number;
}

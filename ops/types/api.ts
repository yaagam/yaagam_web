export type PaginatedResponse<T> = {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ApiResponse<T> = {
  statusCode: number;
  status: string;
  message: string;
  timestamp: string;
  version: string;
  path: string;
  data: T;
};

export type EntityStatus = "ACTIVE" | "INACTIVE" | "DRAFT" | "ARCHIVED";
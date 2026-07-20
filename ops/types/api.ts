export type PaginatedResponse<T> = {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type EntityStatus = "ACTIVE" | "INACTIVE" | "DRAFT" | "ARCHIVED";
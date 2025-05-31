export interface IPaginationResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  links: {
    first: string;
    last: string;
    next: string | null;
    previous: string | null;
  };
}

export type GlobalApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{ field?: string; message?: string; code?: string }>;
  timestamp?: string;
};

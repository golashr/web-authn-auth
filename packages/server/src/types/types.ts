// Define API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// Define domain types
export interface Item {
  id: number;
  name: string;
}

export interface WelcomeResponse {
  message: string;
}

export interface ItemsResponse {
  items: Item[];
}

export interface ErrorResponse {
  message: string;
}

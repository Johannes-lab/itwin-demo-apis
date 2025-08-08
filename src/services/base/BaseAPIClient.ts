import { authService } from "../AuthService";
import { API_CONFIG } from "../config/api.config";

export class BaseAPIClient {
  protected async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await authService.getAccessToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const headers = {
      ...API_CONFIG.DEFAULT_HEADERS,
      Authorization: `${token}`,
      ...options.headers,
    };

    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const error = JSON.parse(errorText);
        console.error("API Error:", error);
        throw new Error(error.error?.message || `Request failed with status ${response.status}`);
      } catch {
        console.error("API Error Text:", errorText);
        throw new Error(`Request failed with status ${response.status}`);
      }
    }

    return response.json();
  }
}

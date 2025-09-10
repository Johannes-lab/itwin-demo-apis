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

    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const method = (options.method || 'GET').toString().toUpperCase();
    const maxRetries = 2; // conservative retries to avoid hammering the API

    let attempt = 0;
    // Only retry idempotent requests (GET/HEAD)
    const canRetry = method === 'GET' || method === 'HEAD';

    while (true) {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.ok) {
        return response.json();
      }

      if (response.status === 429 && canRetry && attempt < maxRetries) {
        // Respect Retry-After header when present, else exponential backoff (2s, 4s)
        const retryAfter = response.headers.get('Retry-After');
        const retrySeconds = retryAfter ? Math.min(30, parseInt(retryAfter, 10) || 0) : 2 * Math.pow(2, attempt);
        const delayMs = Math.max(500, retrySeconds * 1000);
        await new Promise((r) => setTimeout(r, delayMs));
        attempt += 1;
        continue;
      }

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
  }
}

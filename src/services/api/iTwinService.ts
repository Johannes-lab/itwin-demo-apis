import { BaseAPIClient } from "../base/BaseAPIClient";
import { API_CONFIG } from "../config/api.config";
import type { iTwin, iTwinsResponse } from "../types";

export class iTwinService extends BaseAPIClient {
  // Simple in-memory cache and in-flight de-duplication across the app lifetime
  private static cache: { data: iTwin[] | null; expiresAt: number } | null = null;
  private static inflight: Promise<iTwin[] | null> | null = null;

  public async getMyiTwins(): Promise<iTwin[] | null> {
    try {
      const now = Date.now();
      const ttlMs = 60_000; // 1 minute cache window

      if (iTwinService.cache && iTwinService.cache.expiresAt > now) {
        return iTwinService.cache.data;
      }

      if (iTwinService.inflight) {
        return iTwinService.inflight;
      }

      const request = this.fetch<iTwinsResponse>(`${API_CONFIG.ENDPOINTS.ITWINS}?includeInactive=true`, {
        headers: {
          Prefer: "return=representation",
        },
      })
        .then((data) => {
          const list = data.iTwins ?? null;
          iTwinService.cache = { data: list, expiresAt: Date.now() + ttlMs };
          return list;
        })
        .finally(() => {
          iTwinService.inflight = null;
        });

      iTwinService.inflight = request;
      return await request;
    } catch (error) {
      console.error("Error fetching iTwins:", error);
      return null;
    }
  }
}

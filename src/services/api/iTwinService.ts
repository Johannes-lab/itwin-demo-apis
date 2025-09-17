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

      let allTwins: iTwin[] = [];
      let nextUrl: string | null = `${API_CONFIG.ENDPOINTS.ITWINS}?includeInactive=true`;

      while (nextUrl) {
  const data: iTwinsResponse = await this.fetch(nextUrl, {
          headers: {
            Prefer: "return=representation",
          },
        });
        if (Array.isArray(data.iTwins)) {
          allTwins = allTwins.concat(data.iTwins);
        }
        nextUrl = data._links?.next?.href
          ? data._links.next.href.replace(API_CONFIG.BASE_URL, "")
          : null;
      }

      iTwinService.cache = { data: allTwins, expiresAt: Date.now() + ttlMs };
      return allTwins;
    } catch (error) {
      console.error("Error fetching iTwins:", error);
      return null;
    }
  }
}

import { BaseAPIClient } from "../base/BaseAPIClient";
import { API_CONFIG } from "../config/api.config";
import type { iTwin, iTwinsResponse } from "../types";

export class iTwinService extends BaseAPIClient {
  public async getMyiTwins(): Promise<iTwin[] | null> {
    try {
      const data = await this.fetch<iTwinsResponse>(`${API_CONFIG.ENDPOINTS.ITWINS}?includeInactive=true`, {
        headers: {
          Prefer: "return=representation",
        },
      });
      return data.iTwins;
    } catch (error) {
      console.error("Error fetching iTwins:", error);
      return null;
    }
  }
}

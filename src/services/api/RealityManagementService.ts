import { BaseAPIClient } from "../base/BaseAPIClient";
import type { RealityDataListParams, RealityDataListResponse } from "../types";

export class RealityManagementService extends BaseAPIClient {
  public async listRealityData(params: RealityDataListParams = {}): Promise<RealityDataListResponse> {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && `${value}`.length > 0) {
        searchParams.append(key, `${value}`);
      }
    }
    const qs = searchParams.toString();
    const endpoint = `/reality-management/reality-data${qs ? `?${qs}` : ''}`;

    return this.fetch<RealityDataListResponse>(endpoint, {
      headers: {
        // Prefer representation for richer payload if available; API says v1 Accept recommended
        Prefer: "return=representation",
        Accept: "application/vnd.bentley.itwin-platform.v1+json",
      },
    });
  }
}

import { BaseAPIClient } from "../base/BaseAPIClient";
import { API_CONFIG } from "../config/api.config";
import type { iTwinUserMember, iTwinUserMembersResponse, iTwinRolesResponse, AccessControlRole } from "../types";

export class AccessControlService extends BaseAPIClient {
  public async getiTwinUserMembers(iTwinId: string): Promise<iTwinUserMember[] | null> {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.ACCESS_CONTROL.MEMBERS(iTwinId);

      const data = await this.fetch<iTwinUserMembersResponse>(endpoint, {
        headers: {
          Accept: "application/vnd.bentley.itwin-platform.v2+json",
        },
      });
      
      return data.members.filter(member => 
        member.email !== null || member.givenName !== null || member.surname !== null
      );
    } catch (error) {
      console.error("Error fetching iTwin user members:", error);
      return null;
    }
  }

  public async getiTwinRoles(iTwinId: string): Promise<AccessControlRole[] | null> {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.ACCESS_CONTROL.ROLES(iTwinId);
      const data = await this.fetch<iTwinRolesResponse>(endpoint, {
        headers: {
          Accept: "application/vnd.bentley.itwin-platform.v2+json",
        },
      });
      return data.roles ?? [];
    } catch (error) {
      console.error("Error fetching iTwin roles:", error);
      return null;
    }
  }
}

export const API_CONFIG = {
  BASE_URL: "https://api.bentley.com",
  DEFAULT_HEADERS: {
    Accept: "application/vnd.bentley.itwin-platform.v1+json",
  },
  ENDPOINTS: {
    // Core iTwin endpoints
    ITWINS: "/itwins",
    
    // Reality Modeling endpoints
    CONTEXT_CAPTURE: {
      WORKSPACES: "/contextcapture/workspaces",
      JOBS: "/contextcapture/jobs",
    },
    
    // Access Control endpoints
    ACCESS_CONTROL: {
      MEMBERS: (iTwinId: string) => `/accesscontrol/itwins/${iTwinId}/members/users`,
  ROLES: (iTwinId: string) => `/accesscontrol/itwins/${iTwinId}/roles`,
  ROLE: (iTwinId: string, roleId: string) => `/accesscontrol/itwins/${iTwinId}/roles/${roleId}`,
  ALL_PERMISSIONS: '/accesscontrol/itwins/permissions',
    },
  },
} as const;

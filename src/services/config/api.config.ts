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

    // Synchronization endpoints
    SYNCHRONIZATION: {
      MANIFEST_CONNECTIONS: '/synchronization/imodels/manifestconnections',
      MANIFEST_CONNECTION: (connectionId: string) => `/synchronization/imodels/manifestconnections/${connectionId}`,
      MANIFEST_RUNS: (connectionId: string) => `/synchronization/imodels/manifestconnections/${connectionId}/runs`,
      MANIFEST_RUN: (connectionId: string, runId: string) => `/synchronization/imodels/manifestconnections/${connectionId}/runs/${runId}`,
      REPORTS: (iModelId: string, runId: string, taskId?: string) => `/synchronization/reports?imodelId=${iModelId}&runId=${runId}${taskId ? `&taskId=${taskId}`: ''}`,
    },

    // Storage API endpoints
    STORAGE: {
      TOP_LEVEL: (iTwinId: string, top?: number, skip?: number) => `/storage/?iTwinId=${encodeURIComponent(iTwinId)}${typeof top === 'number' ? `&$top=${top}` : ''}${typeof skip === 'number' ? `&$skip=${skip}` : ''}`,
      FOLDER: (folderId: string) => `/storage/folders/${folderId}`,
      FOLDER_LIST: (folderId: string, top?: number, skip?: number) => `/storage/folders/${folderId}/list${typeof top === 'number' ? `?$top=${top}` : ''}${typeof skip === 'number' ? `${typeof top === 'number' ? '&' : '?'}$skip=${skip}` : ''}`,
      FOLDERS_IN_FOLDER: (folderId: string, top?: number, skip?: number) => `/storage/folders/${folderId}/folders${typeof top === 'number' ? `?$top=${top}` : ''}${typeof skip === 'number' ? `${typeof top === 'number' ? '&' : '?'}$skip=${skip}` : ''}`,
      FILES_IN_FOLDER: (folderId: string, top?: number, skip?: number) => `/storage/folders/${folderId}/files${typeof top === 'number' ? `?$top=${top}` : ''}${typeof skip === 'number' ? `${typeof top === 'number' ? '&' : '?'}$skip=${skip}` : ''}`,
      CREATE_FOLDER: (folderId: string) => `/storage/folders/${folderId}/folders`,
      CREATE_FILE: (folderId: string) => `/storage/folders/${folderId}/files`,
      FILE: (fileId: string) => `/storage/files/${fileId}`,
      FILE_COMPLETE: (fileId: string) => `/storage/files/${fileId}/complete`,
      FILE_UPDATE_CONTENT: (fileId: string) => `/storage/files/${fileId}/updatecontent`,
      FILE_DOWNLOAD: (fileId: string) => `/storage/files/${fileId}/download`,
      DELETE_FILE: (fileId: string) => `/storage/files/${fileId}`,
      DELETE_FOLDER: (folderId: string) => `/storage/folders/${folderId}`,
      RECYCLE_BIN: (iTwinId: string, top?: number, skip?: number) => `/storage/recyclebin?iTwinId=${encodeURIComponent(iTwinId)}${typeof top === 'number' ? `&$top=${top}` : ''}${typeof skip === 'number' ? `&$skip=${skip}` : ''}`,
      RESTORE_FILE: (fileId: string) => `/storage/recyclebin/files/${fileId}/restore`,
      RESTORE_FOLDER: (folderId: string) => `/storage/recyclebin/folders/${folderId}/restore`,
      LOCK_FOLDER: (folderId: string) => `/storage/folders/${folderId}/lock`,
      UNLOCK_FOLDER: (folderId: string) => `/storage/folders/${folderId}/unlock`,
      MOVE_FILE: (fileId: string) => `/storage/files/${fileId}/move`,
      MOVE_FOLDER: (folderId: string) => `/storage/folders/${folderId}/move`,
      SEARCH_IN_FOLDER: (folderId: string, name: string, top?: number, skip?: number) => `/storage/folders/${folderId}/search?name=${encodeURIComponent(name)}${typeof top === 'number' ? `&$top=${top}` : ''}${typeof skip === 'number' ? `&$skip=${skip}` : ''}`,
    },
  },
} as const;

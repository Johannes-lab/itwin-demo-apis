import { BaseAPIClient } from "../base/BaseAPIClient";
import { API_CONFIG } from "../config/api.config";
import type { ManifestConnectionCreateRequest, ManifestConnectionResponse, ManifestRunCreateRequest, ManifestRunResponse, ManifestConnection } from "../types";

type ConnectionSummary = { id: string; displayName?: string };
type ConnectionsList = { connections?: ConnectionSummary[] };
type StorageConnection = { id: string; displayName?: string; iModelId: string };
type StorageConnectionResponse = { connection: StorageConnection };
type StorageRun = { id: string; state?: string; result?: string; startDateTime?: string; endDateTime?: string };
type StorageRuns = { runs?: StorageRun[] };
type StorageSourceFile = { id?: string; storageFileId?: string; connectorType?: string };
type StorageSourceFiles = { sourceFiles?: StorageSourceFile[] };

class SynchronizationService extends BaseAPIClient {
  async createManifestConnection(body: ManifestConnectionCreateRequest): Promise<ManifestConnection> {
    const res = await this.fetch<ManifestConnectionResponse>(API_CONFIG.ENDPOINTS.SYNCHRONIZATION.MANIFEST_CONNECTIONS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.connection;
  }

  async createManifestConnectionRun(connectionId: string, body?: ManifestRunCreateRequest): Promise<Response> {
    // For create run, we care about Location header and 202/303. Use fetch directly to access raw response.
    const token = await (await import('../AuthService')).authService.getAccessToken();
    const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SYNCHRONIZATION.MANIFEST_RUNS(connectionId)}`, {
      method: 'POST',
      headers: {
        Accept: API_CONFIG.DEFAULT_HEADERS.Accept,
        Authorization: `${token}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined,
      redirect: 'manual',
    });
    return res;
  }

  async getManifestConnection(connectionId: string): Promise<ManifestConnection> {
    const res = await this.fetch<{ connection: ManifestConnection }>(API_CONFIG.ENDPOINTS.SYNCHRONIZATION.MANIFEST_CONNECTION(connectionId));
    return res.connection;
  }

  async getManifestRun(connectionId: string, runId: string): Promise<ManifestRunResponse> {
    return this.fetch<ManifestRunResponse>(API_CONFIG.ENDPOINTS.SYNCHRONIZATION.MANIFEST_RUN(connectionId, runId));
  }

  // Generic connections list (used to find an existing StorageConnection by name)
  async listConnections(iModelId: string): Promise<ConnectionsList> {
    return this.fetch<ConnectionsList>(`${API_CONFIG.ENDPOINTS.SYNCHRONIZATION.CONNECTIONS}?imodelId=${encodeURIComponent(iModelId)}&$top=50`);
  }

  // StorageConnection APIs
  async createStorageConnection(payload: { iModelId: string; displayName?: string; sourceFiles: Array<{ storageFileId: string; connectorType: string }> }): Promise<StorageConnection> {
    const res = await this.fetch<StorageConnectionResponse>(API_CONFIG.ENDPOINTS.SYNCHRONIZATION.STORAGE_CONNECTIONS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.connection;
  }

  async addStorageSourceFile(connectionId: string, sourceFile: { storageFileId: string; connectorType: string }): Promise<{ sourceFile: StorageSourceFile }> {
    return this.fetch<{ sourceFile: StorageSourceFile }>(API_CONFIG.ENDPOINTS.SYNCHRONIZATION.STORAGE_CONNECTION_SOURCEFILES(connectionId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sourceFile),
    });
  }

  async listStorageSourceFiles(connectionId: string): Promise<StorageSourceFiles> {
    return this.fetch<StorageSourceFiles>(API_CONFIG.ENDPOINTS.SYNCHRONIZATION.STORAGE_CONNECTION_SOURCEFILES(connectionId));
  }

  async runStorageConnection(connectionId: string): Promise<Response> {
    const token = await (await import('../AuthService')).authService.getAccessToken();
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SYNCHRONIZATION.STORAGE_CONNECTION_RUN(connectionId)}`;
    console.log('Attempting to run storage connection with URL:', url);
    console.log('Connection ID:', connectionId);
    const res = await fetch(url, {
      method: 'POST',
      headers: { Accept: API_CONFIG.DEFAULT_HEADERS.Accept, Authorization: `${token}` },
      redirect: 'manual',
    });
    return res;
  }

  async listStorageRuns(connectionId: string): Promise<StorageRuns> {
    return this.fetch<StorageRuns>(API_CONFIG.ENDPOINTS.SYNCHRONIZATION.STORAGE_CONNECTION_RUNS(connectionId));
  }

  async getStorageRun(connectionId: string, runId: string): Promise<{ run: StorageRun }> {
    return this.fetch<{ run: StorageRun }>(API_CONFIG.ENDPOINTS.SYNCHRONIZATION.STORAGE_CONNECTION_RUN_ITEM(connectionId, runId));
  }
}

export const synchronizationService = new SynchronizationService();

import { BaseAPIClient } from "../base/BaseAPIClient";
import { API_CONFIG } from "../config/api.config";
import type {
  CreateFileRequest,
  CreateFolderRequest,
  FileCreateLinksResponse,
  FileResponse,
  FolderListResponse,
  FolderResponse,
  TopLevelListResponse,
  UpdateFileRequest,
  UpdateFolderRequest,
} from "../types";
import type { PagedLinks, StorageListItem } from "../types";

class StorageService extends BaseAPIClient {
  // Top-level listing by iTwinId
  async getTopLevel(iTwinId: string, top?: number, skip?: number): Promise<TopLevelListResponse> {
    return this.fetch<TopLevelListResponse>(API_CONFIG.ENDPOINTS.STORAGE.TOP_LEVEL(iTwinId, top, skip));
  }

  // Folder CRUD / listing
  async getFolder(folderId: string): Promise<FolderResponse> {
    return this.fetch<FolderResponse>(API_CONFIG.ENDPOINTS.STORAGE.FOLDER(folderId));
  }

  async listFolder(folderId: string, top?: number, skip?: number): Promise<FolderListResponse> {
    return this.fetch<FolderListResponse>(API_CONFIG.ENDPOINTS.STORAGE.FOLDER_LIST(folderId, top, skip));
  }

  async createFolder(parentFolderId: string, body: CreateFolderRequest): Promise<FolderResponse> {
    return this.fetch<FolderResponse>(API_CONFIG.ENDPOINTS.STORAGE.CREATE_FOLDER(parentFolderId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  async updateFolder(folderId: string, body: UpdateFolderRequest): Promise<FolderResponse> {
    return this.fetch<FolderResponse>(API_CONFIG.ENDPOINTS.STORAGE.FOLDER(folderId), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  async deleteFolder(folderId: string): Promise<void> {
    await this.fetch<void>(API_CONFIG.ENDPOINTS.STORAGE.DELETE_FOLDER(folderId), { method: 'DELETE' });
  }

  async moveFolder(folderId: string, parentFolderId: string): Promise<void> {
    await this.fetch<void>(API_CONFIG.ENDPOINTS.STORAGE.MOVE_FOLDER(folderId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentFolderId }),
    });
  }

  // File metadata and lifecycle
  async createFile(parentFolderId: string, body: CreateFileRequest): Promise<FileCreateLinksResponse> {
    return this.fetch<FileCreateLinksResponse>(API_CONFIG.ENDPOINTS.STORAGE.CREATE_FILE(parentFolderId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  async getFile(fileId: string): Promise<FileResponse> {
    return this.fetch<FileResponse>(API_CONFIG.ENDPOINTS.STORAGE.FILE(fileId));
  }

  async updateFile(fileId: string, body: UpdateFileRequest): Promise<FileResponse> {
    return this.fetch<FileResponse>(API_CONFIG.ENDPOINTS.STORAGE.FILE(fileId), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.fetch<void>(API_CONFIG.ENDPOINTS.STORAGE.DELETE_FILE(fileId), { method: 'DELETE' });
  }

  async moveFile(fileId: string, parentFolderId: string): Promise<void> {
    await this.fetch<void>(API_CONFIG.ENDPOINTS.STORAGE.MOVE_FILE(fileId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentFolderId }),
    });
  }

  async initiateUpdateContent(fileId: string): Promise<FileCreateLinksResponse> {
    return this.fetch<FileCreateLinksResponse>(API_CONFIG.ENDPOINTS.STORAGE.FILE_UPDATE_CONTENT(fileId), {
      method: 'POST',
    });
  }

  async completeFile(fileId: string): Promise<FileResponse> {
    return this.fetch<FileResponse>(API_CONFIG.ENDPOINTS.STORAGE.FILE_COMPLETE(fileId), { method: 'POST' });
  }

  async getDownloadLocation(fileId: string): Promise<string | null> {
    // Follow redirect to Azure and capture the final URL; avoid reading the body
    const token = await (await import('../AuthService')).authService.getAccessToken();
    const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STORAGE.FILE_DOWNLOAD(fileId)}`, {
      method: 'GET',
      headers: { Accept: 'application/vnd.bentley.itwin-platform.v1+octet-stream', Authorization: `${token}` },
      redirect: 'follow',
      mode: 'cors',
    });
    // res.url should contain the Azure SAS URL after redirect
    return typeof res.url === 'string' && res.url ? res.url : null;
  }

  // Recycle bin
  async getRecycleBin(iTwinId: string, top?: number, skip?: number): Promise<{ items: StorageListItem[]; _links: PagedLinks }> {
    return this.fetch<{ items: StorageListItem[]; _links: PagedLinks }>(API_CONFIG.ENDPOINTS.STORAGE.RECYCLE_BIN(iTwinId, top, skip));
  }

  // Search folders/files within a folder context (we'll filter folders client-side for moves)
  async searchInFolder(folderId: string, name: string, top?: number, skip?: number): Promise<{ items: StorageListItem[]; _links: PagedLinks }> {
    return this.fetch<{ items: StorageListItem[]; _links: PagedLinks }>(API_CONFIG.ENDPOINTS.STORAGE.SEARCH_IN_FOLDER(folderId, name, top, skip));
  }

  async restoreFolder(folderId: string): Promise<void> {
    await this.fetch<void>(API_CONFIG.ENDPOINTS.STORAGE.RESTORE_FOLDER(folderId), { method: 'POST' });
  }

  async restoreFile(fileId: string): Promise<void> {
    await this.fetch<void>(API_CONFIG.ENDPOINTS.STORAGE.RESTORE_FILE(fileId), { method: 'POST' });
  }

  // Helpers for absolute URLs returned by API (_links)
  async completeByUrl(completeUrl: string): Promise<FileResponse> {
    const token = await (await import('../AuthService')).authService.getAccessToken();
    const res = await fetch(completeUrl, {
      method: 'POST',
      headers: { Accept: API_CONFIG.DEFAULT_HEADERS.Accept, Authorization: `${token}` },
    });
    if (!res.ok) throw new Error(`Complete failed: ${res.status}`);
    return res.json();
  }
}

export const storageService = new StorageService();

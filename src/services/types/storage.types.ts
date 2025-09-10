// Basic shapes for Storage API
export type StorageLink = { href: string };

export interface PagedLinks {
  self?: StorageLink;
  prev?: StorageLink;
  next?: StorageLink;
  folder?: StorageLink; // present on top-level response
}

export interface StorageItemBase {
  id: string;
  displayName: string;
  description?: string;
  path?: string;
  lastModifiedByDisplayName?: string;
  createdDateTime?: string;
  lastModifiedDateTime?: string;
  parentFolderId?: string;
  _links?: Record<string, StorageLink>;
}

export interface StorageFolder extends StorageItemBase {
  type?: 'folder';
}

export interface StorageFile extends StorageItemBase {
  type?: 'file';
  size?: number;
}

export type StorageListItem = (StorageFolder | StorageFile) & { type: 'folder' | 'file' };

export interface TopLevelListResponse {
  items: StorageListItem[];
  _links: PagedLinks;
}

export interface FolderResponse {
  folder: StorageFolder;
}

export interface FileResponse {
  file: StorageFile;
}

export interface FolderListResponse {
  items: StorageListItem[];
  _links: PagedLinks;
}

export interface CreateFolderRequest {
  displayName: string;
  description?: string;
}

export interface CreateFileRequest {
  displayName: string;
  description?: string;
}

export interface FileCreateLinksResponse {
  _links: { uploadUrl: StorageLink; completeUrl: StorageLink };
}

export interface UpdateFolderRequest {
  displayName?: string;
  description?: string;
}

export interface UpdateFileRequest {
  displayName: string; // required per docs
  description?: string;
}

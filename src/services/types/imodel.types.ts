// iModel API types based on Bentley iModels API v2

export interface Point {
  latitude: number;
  longitude: number;
}

export interface Extent {
  southWest: Point;
  northEast: Point;
}

export interface GeographicCoordinateSystem {
  horizontalCRSId: string;
}

export interface IModelLinks {
  creator?: { href: string };
  changesets?: { href: string };
  namedVersions?: { href: string };
  upload?: { href: string };
  complete?: { href: string };
}

export type IModelState = 'initialized' | 'notInitialized';

export interface IModel {
  id: string;
  displayName: string;
  name: string;
  description?: string;
  state: IModelState;
  dataCenterLocation: string;
  createdDateTime?: string; // Made optional in case not returned by list API
  iTwinId: string;
  isSecured: boolean;
  extent?: Extent;
  geographicCoordinateSystem?: GeographicCoordinateSystem;
  _links?: IModelLinks; // Made optional since it might not always be present
  // Additional fields for enhanced display
  creatorName?: string; // Will be populated from access control API
  creatorId?: string; // Extracted from creator link
}

export interface IModelsResponse {
  iModels: IModel[];
  _links: {
    self?: { href: string };
    prev?: { href: string };
    next?: { href: string };
  };
}

export interface SingleIModelResponse {
  iModel: IModel;
}

// For creating iModels
export type CreationMode = 'empty' | 'fromiModelVersion' | 'fromBaseline';

export interface IModelTemplate {
  iModelId: string;
  changesetId?: string;
}

export interface BaselineFile {
  size: number;
}

export interface CreateIModelRequest {
  iTwinId: string;
  name: string;
  description?: string;
  creationMode?: CreationMode;
  extent?: Extent;
  template?: IModelTemplate;
  baselineFile?: BaselineFile;
  geographicCoordinateSystem?: GeographicCoordinateSystem;
}

export interface UpdateIModelRequest {
  displayName?: string;
  description?: string;
}

// Changeset and Named Version types
export interface ChangesetSynchronizationInfo {
  taskId: string;
  state: string;
}

export interface ChangesetContainerAccessInfo {
  account: string;
  container: string;
  dbName: string;
}

export interface ChangesetApplication {
  id: string;
  name: string;
  version: string;
}

export interface ChangesetLinks {
  creator?: { href: string };
  namedVersion?: { href: string };
  download?: { href: string };
}

export interface Changeset {
  id: string;
  displayName: string;
  description?: string;
  index: number;
  parentId?: string;
  createdDateTime: string;
  pushDateTime?: string;
  state: string;
  containingChanges: boolean;
  fileSize?: number;
  briefcaseId?: number;
  synchronizationInfo?: ChangesetSynchronizationInfo;
  containerAccessInfo?: ChangesetContainerAccessInfo;
  application?: ChangesetApplication;
  _links?: ChangesetLinks;
  // Enhanced fields
  creatorName?: string;
  creatorId?: string;
}

export interface ChangesetsResponse {
  changesets: Changeset[];
  _links: {
    self?: { href: string };
    prev?: { href: string };
    next?: { href: string };
  };
}

export interface NamedVersionLinks {
  creator?: { href: string };
  changeset?: { href: string };
}

export interface NamedVersion {
  id: string;
  displayName: string;
  description?: string;
  changesetId: string;
  changesetIndex: number;
  createdDateTime: string;
  application?: ChangesetApplication;
  _links?: NamedVersionLinks;
  // Enhanced fields
  creatorName?: string;
  creatorId?: string;
}

export interface NamedVersionsResponse {
  namedVersions: NamedVersion[];
  _links: {
    self?: { href: string };
    prev?: { href: string };
    next?: { href: string };
  };
}

export interface NamedVersionDetailResponse {
  namedVersion: NamedVersion;
}
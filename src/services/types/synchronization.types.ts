// Types for Synchronization API
export type AuthType = 'User' | 'Service';

export interface ManifestSourceFileCreate {
  sourceFileId: string;
}

export interface ManifestConnectionCreateRequest {
  displayName?: string;
  iModelId: string;
  authenticationType?: AuthType;
  sourceFiles: ManifestSourceFileCreate[];
}

export interface ManifestConnectionLinks {
  iModel: { href: string };
  iTwin: { href: string };
  lastRun?: { href: string };
}

export interface ManifestConnection {
  id: string;
  displayName?: string;
  iModelId: string;
  iTwinId: string;
  authenticationType: AuthType;
  _links: ManifestConnectionLinks;
}

export interface ManifestConnectionResponse { connection: ManifestConnection }

export interface CreateManifestRunSourceFileChild {
  id: string;
  parentId: string;
  name: string;
  url: string;
  connectorType: string;
  relativePath?: string | null;
  documentAttribute?: Record<string, unknown>;
}

export interface CreateManifestRunSourceFile {
  id: string;
  name: string;
  action: 'bridge' | 'unmap';
  url: string;
  connectorType: string;
  relativePath?: string | null;
  documentAttribute?: Record<string, unknown>;
  children?: CreateManifestRunSourceFileChild[];
}

export interface ManifestRunCreateRequest {
  documentAttributeSchemaUrl?: string;
  sourceFiles?: CreateManifestRunSourceFile[];
}

export interface ManifestRun {
  id: string;
  connectionId: string;
  startDateTime?: string;
  endDateTime?: string;
  phase?: string;
  state: string;
  result?: string;
}

export interface ManifestRunResponse { run: ManifestRun }

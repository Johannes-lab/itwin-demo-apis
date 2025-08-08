export interface RealityDataSummary {
  id: string;
  displayName: string;
  type: string;
  // Optional extended fields when Prefer: return=representation
  dataset?: string;
  group?: string;
  description?: string;
  tags?: string[];
  rootDocument?: string;
  size?: number;
  classification?: string;
  dataCenterLocation?: string;
  modifiedDateTime?: string;
  lastAccessedDateTime?: string;
  createdDateTime?: string;
  ownerId?: string;
}

export interface RealityDataListResponse {
  realityData: RealityDataSummary[];
  _links?: {
    next?: { href: string };
  };
}

export interface RealityDataListParams {
  iTwinId?: string;
  continuationToken?: string;
  $top?: number;
  extent?: string; // "lonSW,latSW,lonNE,latNE"
  $orderBy?: string; // e.g., "displayName desc"
  $search?: string;
  types?: string; // comma-separated
  acquisitionDateTime?: string; // start/end
  createdDateTime?: string;
  modifiedDateTime?: string;
  lastAccessedDateTime?: string;
  ownerId?: string;
  dataCenter?: string;
  tag?: string;
}

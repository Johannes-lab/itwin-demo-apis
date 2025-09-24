// Reporting API types and interfaces

export interface ReportingAPIResponse<T> {
  value: T[];
  '@odata.count'?: number;
  '@odata.nextLink'?: string;
}

export interface Report {
  id: string;
  displayName: string;
  description?: string;
  iTwinId: string;
  projectId?: string;
  odataFeedUrl?: string;
  createdDateTime: string;
  modifiedDateTime: string;
}

export interface IModelElement {
  ECInstanceId: string;
  ECClassId: string;
  Model: {
    Id: string;
    RelECClassId: string;
  };
  LastMod: string;
  CodeSpec: {
    Id: string;
    RelECClassId: string;
  };
  CodeScope: {
    Id: string;
    RelECClassId: string;
  };
  CodeValue: string;
  UserLabel?: string;
  Parent?: {
    Id: string;
    RelECClassId: string;
  };
  FederationGuid?: string;
  JsonProperties?: string;
  Origin?: {
    X: number;
    Y: number;
    Z: number;
  };
  YawPitchRollAngles?: {
    Yaw: number;
    Pitch: number;
    Roll: number;
  };
  BBoxLow?: {
    X: number;
    Y: number;
    Z: number;
  };
  BBoxHigh?: {
    X: number;
    Y: number;
    Z: number;
  };
  GeometryStream?: string;
  Category?: {
    Id: string;
    RelECClassId: string;
  };
}

export interface IModelClass {
  ECInstanceId: string;
  Name: string;
  DisplayLabel?: string;
  Description?: string;
  Type: number;
  Modifier: number;
  Schema: {
    Id: string;
    RelECClassId: string;
  };
}

export interface IModelSchema {
  ECInstanceId: string;
  Name: string;
  DisplayLabel?: string;
  Description?: string;
  VersionMajor: number;
  VersionMinor: number;
  VersionSub: number;
  Alias?: string;
}

export interface IModelModel {
  ECInstanceId: string;
  Name: string;
  IsPrivate: boolean;
  IsTemplate: boolean;
  JsonProperties?: string;
  ParentModel?: {
    Id: string;
    RelECClassId: string;
  };
  ModeledElement: {
    Id: string;
    RelECClassId: string;
  };
}

export interface ReportingQueryOptions {
  $select?: string;
  $filter?: string;
  $orderby?: string;
  $top?: number;
  $skip?: number;
  $count?: boolean;
}

export interface ElementSummary {
  className: string;
  displayLabel?: string;
  count: number;
  schema: string;
}

export interface ModelSummary {
  id: string;
  name: string;
  isPrivate: boolean;
  isTemplate: boolean;
  elementCount?: number;
}
import { iTwinService } from "./iTwinService";
import { RealityModelingService } from "./RealityModelingService";
import { AccessControlService } from "./AccessControlService";
import { RealityManagementService } from "./RealityManagementService";
import type { CreateJobRequest } from "../types";

// Service instances
export const iTwinApiService = new iTwinService();
export const realityModelingService = new RealityModelingService();
export const accessControlService = new AccessControlService();
export const realityManagementService = new RealityManagementService();

// Unified service interface (for backward compatibility)
export class iTwinAPIService {
  // iTwin methods
  public async getMyiTwins() {
    return iTwinApiService.getMyiTwins();
  }

  // Reality Modeling methods
  public async createWorkspace(name: string, iTwinId?: string) {
    return realityModelingService.createWorkspace(name, iTwinId);
  }

  public async getWorkspaces() {
    return realityModelingService.getWorkspaces();
  }

  public async createJob(jobRequest: CreateJobRequest) {
    return realityModelingService.createJob(jobRequest);
  }

  public async getJobs() {
    return realityModelingService.getJobs();
  }

  public async getJob(jobId: string) {
    return realityModelingService.getJob(jobId);
  }

  public async submitJob(jobId: string) {
    return realityModelingService.submitJob(jobId);
  }

  public async cancelJob(jobId: string) {
    return realityModelingService.cancelJob(jobId);
  }

  // Access Control methods
  public async getiTwinUserMembers(iTwinId: string) {
    return accessControlService.getiTwinUserMembers(iTwinId);
  }

  public async getiTwinRoles(iTwinId: string) {
    return accessControlService.getiTwinRoles(iTwinId);
  }

  // Reality Management methods
  public async listRealityData(params?: import("../types").RealityDataListParams) {
    return realityManagementService.listRealityData(params);
  }
}

// Default export for backward compatibility
export const iTwinApiServiceLegacy = new iTwinAPIService();

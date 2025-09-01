import { BaseAPIClient } from "../base/BaseAPIClient";
import { API_CONFIG } from "../config/api.config";
import type {
  Workspace,
  WorkspaceResponse,
  WorkspacesResponse,
  Job,
  JobResponse,
  JobsResponse,
  CreateJobRequest,
  JobProgressResponse,
} from "../types";

export class RealityModelingService extends BaseAPIClient {
  public async createWorkspace(name: string, iTwinId?: string): Promise<Workspace | null> {
    try {
      const body: { name: string; iTwinId?: string } = { name };
      if (iTwinId) {
        body.iTwinId = iTwinId;
      }

      const data = await this.fetch<WorkspaceResponse>(API_CONFIG.ENDPOINTS.CONTEXT_CAPTURE.WORKSPACES, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      return data.workspace;
    } catch (error) {
      console.error("Error creating workspace:", error);
      return null;
    }
  }

  public async getWorkspaces(): Promise<Workspace[] | null> {
    try {
      const data = await this.fetch<WorkspacesResponse>(API_CONFIG.ENDPOINTS.CONTEXT_CAPTURE.WORKSPACES);
      return data.workspaces;
    } catch (error) {
      console.error("Error fetching workspaces:", error);
      return null;
    }
  }

  public async createJob(jobRequest: CreateJobRequest): Promise<Job | null> {
    try {
      const data = await this.fetch<JobResponse>(API_CONFIG.ENDPOINTS.CONTEXT_CAPTURE.JOBS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jobRequest),
      });
      return data.job;
    } catch (error) {
      console.error("Error creating job:", error);
      return null;
    }
  }

  public async getJobs(): Promise<Job[] | null> {
    try {
      const data = await this.fetch<JobsResponse>(API_CONFIG.ENDPOINTS.CONTEXT_CAPTURE.JOBS);
      return data.jobs;
    } catch (error) {
      console.error("Error fetching jobs:", error);
      return null;
    }
  }

  public async getJob(jobId: string): Promise<Job | null> {
    try {
      const data = await this.fetch<JobResponse>(`${API_CONFIG.ENDPOINTS.CONTEXT_CAPTURE.JOBS}/${jobId}`);
      return data.job;
    } catch (error) {
      console.error("Error fetching job:", error);
      return null;
    }
  }

  public async submitJob(jobId: string): Promise<Job | null> {
    // Align with tutorial: PATCH job state to active
    try {
      const data = await this.fetch<JobResponse>(`${API_CONFIG.ENDPOINTS.CONTEXT_CAPTURE.JOBS}/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: "active" }),
      });
      return data.job;
    } catch (error) {
      console.error("Error submitting job:", error);
      return null;
    }
  }

  public async cancelJob(jobId: string): Promise<Job | null> {
    try {
      const data = await this.fetch<JobResponse>(`${API_CONFIG.ENDPOINTS.CONTEXT_CAPTURE.JOBS}/${jobId}/cancel`, {
        method: "POST",
      });
      return data.job;
    } catch (error) {
      console.error("Error cancelling job:", error);
      return null;
    }
  }

  public async getJobProgress(jobId: string) {
    try {
      const data = await this.fetch<JobProgressResponse>(`${API_CONFIG.ENDPOINTS.CONTEXT_CAPTURE.JOBS}/${jobId}/progress`);
      return data.jobProgress;
    } catch (error) {
      console.error("Error fetching job progress:", error);
      return null;
    }
  }
}

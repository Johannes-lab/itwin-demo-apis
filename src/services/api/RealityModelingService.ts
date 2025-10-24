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
  private resolvedWorkspacesEndpoint: string | null = null;
  private workspaceEndpointTried = false;
  public lastWorkspacesError: any = null;

  private async resolveWorkspacesEndpoint(): Promise<string> {
    if (this.resolvedWorkspacesEndpoint) return this.resolvedWorkspacesEndpoint;
    if (this.workspaceEndpointTried) return API_CONFIG.ENDPOINTS.CONTEXT_CAPTURE.WORKSPACES; // fallback original
    this.workspaceEndpointTried = true;
    const candidates = [
      API_CONFIG.ENDPOINTS.CONTEXT_CAPTURE.WORKSPACES,
      '/itwincapture/workspaces',
      '/contextcapture/v1/workspaces',
      '/itwincapture/v1/workspaces'
    ];
    for (const ep of candidates) {
      try {
        // HEAD would be ideal; use GET with $top=1 style param if supported later; for now just GET
        const res = await fetch(`${API_CONFIG.BASE_URL}${ep}`, { headers: { Accept: API_CONFIG.DEFAULT_HEADERS.Accept } });
        if (res.ok) { this.resolvedWorkspacesEndpoint = ep; return ep; }
      } catch { /* ignore */ }
    }
    // If none succeed, keep default (will yield 404 but logged)
    this.resolvedWorkspacesEndpoint = API_CONFIG.ENDPOINTS.CONTEXT_CAPTURE.WORKSPACES;
    return this.resolvedWorkspacesEndpoint;
  }
  public async createWorkspace(name: string, iTwinId?: string): Promise<Workspace | null> {
    try {
      const body: { name: string; iTwinId?: string } = { name };
      if (iTwinId) {
        body.iTwinId = iTwinId;
      }
      const ep = await this.resolveWorkspacesEndpoint();
      const data = await this.fetch<WorkspaceResponse>(ep, {
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
      const ep = await this.resolveWorkspacesEndpoint();
      const data = await this.fetch<WorkspacesResponse>(ep);
      return data.workspaces;
    } catch (error) {
      console.error("Error fetching workspaces:", error);
      this.lastWorkspacesError = error;
      return null;
    }
  }

  public async deleteWorkspace(workspaceId: string): Promise<boolean> {
    try {
      const ep = await this.resolveWorkspacesEndpoint();
      await this.fetch<null>(`${ep}/${workspaceId}`, { method: 'DELETE' });
      return true;
    } catch (error) {
      console.error('Error deleting workspace:', error);
      return false;
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

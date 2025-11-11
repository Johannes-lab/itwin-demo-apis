import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ArrowLeft, GitBranch, Clock, User, Download, Eye, FileOutput, Loader2, Folder as FolderIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { IModel, Changeset, NamedVersion } from '../services/types';
// import { exportService } from '../services/api/ExportService'; // deprecated direct export usage
import { exportConnectionService, type ExportRun, type ExportConnection, type CreateRunRequest } from '../services/api/ExportConnectionService';
import { exportAuthorizationService } from '../services/api/ExportAuthorizationService';
import { storageService } from '../services/api/StorageService';
import { iModelService } from '../services/api/IModelService';
import { CreateNamedVersionModal } from './CreateNamedVersionModal';

interface IModelVersionsComponentProps {
  iModel: IModel;
  iTwinId?: string;
}

export default function IModelVersionsComponent({ iModel, iTwinId }: IModelVersionsComponentProps) {
  const navigate = useNavigate();
  const [changesets, setChangesets] = useState<Changeset[]>([]);
  const [namedVersions, setNamedVersions] = useState<NamedVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  // const [exportDownloadUrls, setExportDownloadUrls] = useState<Record<string,string>>({}); // disabled in root test
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [ifcVersion, setIfcVersion] = useState<'IFC2X3' | 'IFC4' | 'IFC4X3'>('IFC4');
  // AuthorizationInformation state
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isUserAuthorized, setIsUserAuthorized] = useState<boolean | null>(null);
  const [authorizationUrl, setAuthorizationUrl] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(false);
  // Folder selection re-enabled
  const [storageFolders, setStorageFolders] = useState<{ id: string; displayName: string }[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [loadingFolders, setLoadingFolders] = useState(false);
  // const [uploadingToStorage, setUploadingToStorage] = useState<string | null>(null); // disabled

  useEffect(() => {
    const loadChangesetsAndVersions = async () => {
      if (!iModel.id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('Loading changesets and named versions for iModel:', iModel.id);
        console.log('iTwinId:', iTwinId);
        
        // Load changesets and named versions in parallel
        const [changeSetsData, namedVersionsData] = await Promise.all([
          iModelService.getChangesets(iModel.id, iTwinId),
          iModelService.getNamedVersions(iModel.id, iTwinId)
        ]);
        
        console.log('Loaded changesets:', changeSetsData);
        console.log('Loaded named versions:', namedVersionsData);
        
        setChangesets(changeSetsData);
        setNamedVersions(namedVersionsData);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to load changesets and named versions:', error);
        setError(`Failed to load data: ${errorMessage}`);
        // Set empty arrays on error
        setChangesets([]);
        setNamedVersions([]);
      } finally {
        setLoading(false);
      }
    };

    loadChangesetsAndVersions();
  }, [iModel.id, iTwinId]);

  const handleNamedVersionCreated = async () => {
    // Reload the named versions after creating a new one
    try {
      console.log('Reloading named versions after creation...');
      const namedVersionsData = await iModelService.getNamedVersions(iModel.id, iTwinId);
      console.log('Reloaded named versions:', namedVersionsData);
      setNamedVersions(namedVersionsData);
    } catch (error) {
      console.error('Failed to reload named versions:', error);
    }
  };

  const handleGoBack = () => {
    if (iTwinId) {
      navigate(`/itwins/${iTwinId}/imodels`);
    } else {
      navigate(-1);
    }
  };

  const handleViewNamedVersion = (version: NamedVersion) => {
    // TODO: Implement named version viewing functionality
    // For now, show an alert with version details
    alert(`Viewing Named Version: ${version.displayName}\nChangeset: ${version.changesetId}\nDescription: ${version.description || 'No description'}`);
    
    // Future: This could navigate to a dedicated view or open a viewer
    // navigate(`/itwins/${iTwinId}/imodels/${iModel.id}/versions/${version.id}/view`);
  };

  const handleDownloadNamedVersion = async (version: NamedVersion) => {
    try {
      console.log('Downloading named version:', version.displayName, 'at changeset index:', version.changesetIndex);
      
      const fileName = `${iModel.displayName}-${version.displayName}-changeset-${version.changesetIndex}.bim`;
      await iModelService.downloadIModelAtChangeset(iModel.id, version.changesetIndex, fileName);
      
      // Could show a success toast here
      console.log('Download initiated for named version:', version.displayName);
    } catch (error) {
      console.error('Failed to download named version:', error);
      alert(`Failed to download named version: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDownloadChangeset = async (changeset: Changeset) => {
    try {
      console.log('Downloading changeset:', changeset.displayName, 'changeset index:', changeset.index);
      
      const fileName = `${iModel.displayName}-changeset-${changeset.index}-${changeset.displayName}.bim`;
      await iModelService.downloadIModelAtChangeset(iModel.id, changeset.index, fileName);
      
      console.log('Download initiated for changeset:', changeset.displayName);
    } catch (error) {
      console.error('Failed to download changeset:', error);
      alert(`Failed to download changeset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const exportNamedVersions = () => {
    if (!namedVersions || namedVersions.length === 0) {
      alert('No named versions to export');
      return;
    }
    const minimal = namedVersions.map(v => ({
      id: v.id,
      displayName: v.displayName,
      description: v.description,
      changesetId: v.changesetId,
      changesetIndex: v.changesetIndex,
      createdDateTime: v.createdDateTime,
      creatorName: (v as unknown as { creatorName?: string }).creatorName || v.creatorId,
    }));
    const blob = new Blob([JSON.stringify({ iModelId: iModel.id, count: minimal.length, namedVersions: minimal }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const stamp = new Date().toISOString().replace(/[:]/g,'-');
    a.download = `${iModel.displayName || iModel.id}-named-versions-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Folder loading disabled during root test

  const ensureConnection = async (): Promise<ExportConnection | null> => {
    if (connectionId) {
      const existing = await exportConnectionService.getConnection(connectionId);
      if (existing) return existing;
    }
    // Create a new connection for this iModel/iTwin context
    const created = await exportConnectionService.createConnection({
      iModelId: iModel.id,
      displayName: `conn-${iModel.displayName?.slice(0,12) || iModel.id.slice(0,8)}`,
      authenticationType: 'User',
      projectId: iTwinId,
      description: 'UI generated export connection'
    });
    if (created) setConnectionId(created.id);
    return created;
  };

  const startIFCExport = async (version: NamedVersion) => {
    if (exportingId) return;
    setExportingId(version.id);
    try {
      // Block if authorization not yet granted
      if (isAuthChecked && isUserAuthorized === false) {
        alert('Long-running export authorization required. Please authorize and then click Retry Authorization.');
        setExportingId(null);
        return;
      }
      if (!isAuthChecked) {
        // Perform on-demand check if user skipped initial automatic check
        await checkAuthorization();
        if (isUserAuthorized === false) {
          alert('Authorization required. Please use the Authorize button, then Retry Authorization.');
          setExportingId(null);
          return;
        }
      }
      const conn = await ensureConnection();
      if (!conn) throw new Error('No export connection');
      const outputOptions: CreateRunRequest['outputOptions'] = selectedFolderId
        ? { location: 'STORAGE', folderId: selectedFolderId, saveLogs: true, replaceOlderFile: false }
        : { location: 'STORAGE', saveLogs: true, replaceOlderFile: false };
      const started = await exportConnectionService.createRun(conn.id, {
        exportType: 'IFC',
        ifcVersion: mapIfcVersion(ifcVersion),
        projectId: iTwinId,
        inputOptions: { changesetId: version.changesetId },
        outputOptions
      });
      if (!started) throw new Error('Run start failed');
      pollRunsList(conn.id, version.id, 0);
    } catch (e) {
      console.error(e);
      alert('Failed to start IFC export run');
      setExportingId(null);
    }
  };

  const pollRunsList = async (connId: string, versionId: string, attempt: number) => {
    const backoff = [3,5,8,12,20,30];
    const runs: ExportRun[] = await exportConnectionService.listRuns(connId);
    const latest = runs[0]; // Assuming newest first; adjust if needed
    if (!latest) {
      if (attempt < backoff.length) setTimeout(()=>pollRunsList(connId, versionId, attempt+1), backoff[attempt]*1000); else setExportingId(null);
      return;
    }
    const state = latest.state.toLowerCase();
    if (state === 'completed') {
      // success or failure?
      if (latest.result && latest.result.toLowerCase() !== 'success') {
        alert('IFC export run failed');
        setExportingId(null); return;
      }
      // output saved to storage automatically if folder selected; attempt to locate by listing folder (best-effort)
      // Root export: file should appear in default storage root (not enumerated here).
      setExportingId(null);
      return;
    }
    if (state === 'failed') {
      alert('IFC export run failed'); setExportingId(null); return;
    }
    const nextDelay = backoff[Math.min(attempt, backoff.length-1)] * 1000;
    setTimeout(()=>pollRunsList(connId, versionId, attempt+1), nextDelay);
  };

  const mapIfcVersion = (v: 'IFC2X3' | 'IFC4' | 'IFC4X3'): CreateRunRequest['ifcVersion'] => {
    // Map simplified selector to accepted labels from tutorial
    switch (v) {
      case 'IFC2X3': return 'IFC2x3';
      case 'IFC4X3': return 'IFC4.3';
      case 'IFC4':
      default: return 'IFC4 RV 1.2';
    }
  };

  // AuthorizationInformation check (initial)
  const checkAuthorization = async () => {
    try {
      setAuthChecking(true);
      const origin = window.location.origin;
      const info = await exportAuthorizationService.getAuthorizationInformation(origin);
      if (info) {
        setIsUserAuthorized(info.isUserAuthorized);
        setAuthorizationUrl(info._links?.authorizationUrl?.href || null);
      } else {
        setIsUserAuthorized(null);
        setAuthorizationUrl(null);
      }
      setIsAuthChecked(true);
    } catch (e) {
      console.warn('AuthorizationInformation request failed', e);
      setIsUserAuthorized(null);
      setAuthorizationUrl(null);
      setIsAuthChecked(true);
    } finally {
      setAuthChecking(false);
    }
  };

  // Run once when versions tab data loads
  useEffect(() => {
    if (!isAuthChecked && namedVersions.length > 0) {
      // Fire and forget, user can still trigger manual retry
      checkAuthorization();
    }
  }, [namedVersions, isAuthChecked]);

  // Load storage top-level folders for selection
  useEffect(() => {
    const loadFolders = async () => {
      if (!iTwinId) return;
      setLoadingFolders(true);
      try {
        const top = await storageService.getTopLevel(iTwinId, 50, 0);
        // Filter only folders
        const folders = (top.items || []).filter(item => item.type === 'folder').map(f => ({ id: f.id, displayName: f.displayName || f.id }));
        setStorageFolders(folders);
        // Keep previously selected if still exists
        if (selectedFolderId && !folders.find(f=>f.id===selectedFolderId)) {
          setSelectedFolderId('');
        }
      } catch (e) {
        console.warn('Failed to load storage folders', e);
      } finally {
        setLoadingFolders(false);
      }
    };
    loadFolders();
  }, [iTwinId, selectedFolderId]);

  // Upload to storage disabled for root test

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleGoBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{iModel.displayName}</h1>
          <p className="text-muted-foreground">Changesets and Named Versions</p>
        </div>
      </div>

      {/* iModel Info */}
      <Card>
        <CardHeader>
          <CardTitle>iModel Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">ID</p>
            <p className="font-mono text-sm">{iModel.id}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">State</p>
            <Badge variant={iModel.state === 'initialized' ? 'default' : 'secondary'}>
              {iModel.state}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Data Center</p>
            <p className="text-sm">{iModel.dataCenterLocation}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Created</p>
            <p className="text-sm">{iModel.createdDateTime ? formatDate(iModel.createdDateTime) : 'N/A'}</p>
          </div>
          {iModel.description && (
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="text-sm">{iModel.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="text-destructive font-medium">Error Loading Data</div>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs for Changesets and Named Versions */}
      <Tabs defaultValue="changesets" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="changesets">
            <GitBranch className="w-4 h-4 mr-2" />
            Changesets ({changesets.length})
          </TabsTrigger>
          <TabsTrigger value="versions">
            <Clock className="w-4 h-4 mr-2" />
            Named Versions ({namedVersions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="changesets" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p>Loading changesets...</p>
              </CardContent>
            </Card>
          ) : changesets.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No changesets found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {changesets.map((changeset) => (
                <Card key={changeset.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{changeset.displayName}</h3>
                          <Badge variant="outline">#{changeset.index}</Badge>
                        </div>
                        {changeset.description && (
                          <p className="text-sm text-muted-foreground mb-2">{changeset.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {changeset.creatorName || changeset.creatorId || 'Unknown'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(changeset.pushDateTime || changeset.createdDateTime)}
                          </span>
                          {changeset.fileSize && (
                            <span className="text-xs text-muted-foreground">
                              Size: {(changeset.fileSize / 1024).toFixed(1)} KB
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownloadChangeset(changeset)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="versions" className="space-y-4">
          {/* Actions: Create + Export */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
            <CreateNamedVersionModal
              iModelId={iModel.id}
              changesets={changesets}
              onNamedVersionCreated={handleNamedVersionCreated}
            />
            <Button variant="outline" size="sm" onClick={exportNamedVersions} disabled={loading || namedVersions.length===0} title="Export Named Versions JSON">
              Export JSON
            </Button>
            </div>
            <div className="grid md:grid-cols-3 gap-4 items-end">
              <div className="space-y-1">
                <label className="text-xs font-medium">IFC Version</label>
                <select className="border rounded px-2 py-1 text-sm w-full" value={ifcVersion} onChange={e=>setIfcVersion(e.target.value as 'IFC2X3' | 'IFC4' | 'IFC4X3')}>
                  <option value="IFC2X3">IFC2X3</option>
                  <option value="IFC4">IFC4</option>
                  <option value="IFC4X3">IFC4X3</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium flex items-center gap-1"><FolderIcon className="w-3 h-3"/>Storage Folder (optional)</label>
                <select className="border rounded px-2 py-1 text-sm w-full" value={selectedFolderId} onChange={e=>setSelectedFolderId(e.target.value)} disabled={loadingFolders}>
                  <option value="">Root (default)</option>
                  {storageFolders.map(f => (
                    <option key={f.id} value={f.id}>{f.displayName}</option>
                  ))}
                </select>
                {loadingFolders && <div className="text-[10px] text-muted-foreground">Loading folders…</div>}
              </div>
              <div className="text-[11px] text-muted-foreground space-y-1">
                <div>After the IFC export job finishes you can click IFC to start the export. Storage save is automatic to root currently.</div>
                {authChecking && <div className="text-xs">Checking export authorization…</div>}
                {isAuthChecked && isUserAuthorized === false && (
                  <div className="text-xs text-destructive flex flex-col gap-1">
                    <span>Long-running export authorization required.</span>
                    {authorizationUrl && (
                      <Button variant="destructive" size="sm" onClick={() => window.open(authorizationUrl!, '_blank')}>
                        Authorize
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={checkAuthorization}>
                      Retry Authorization
                    </Button>
                  </div>
                )}
                {isAuthChecked && isUserAuthorized === true && (
                  <div className="text-xs text-green-600">Authorization confirmed ✔</div>
                )}
              </div>
            </div>
          </div>
          
          {loading ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p>Loading named versions...</p>
              </CardContent>
            </Card>
          ) : namedVersions.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No named versions found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {namedVersions.map((version) => (
                <Card key={version.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">{version.displayName}</h3>
                        {version.description && (
                          <p className="text-sm text-muted-foreground mb-2">{version.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {version.creatorName || version.creatorId || 'Unknown'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(version.createdDateTime)}
                          </span>
                          <span className="flex items-center gap-1">
                            <GitBranch className="w-3 h-3" />
                            Changeset: {version.changesetId} (#{version.changesetIndex})
                          </span>
                          <span className="font-mono text-xs">
                            ID: {version.id}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewNamedVersion(version)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownloadNamedVersion(version)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                        {
                          /* Download link disabled in root test; show only export button */
                        }
                        {
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!!exportingId && exportingId!==version.id}
                            onClick={()=>startIFCExport(version)}
                            title="Export IFC"
                          >
                            {exportingId === version.id ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileOutput className="w-4 h-4 mr-1" />}
                            {exportingId === version.id ? 'Exporting…' : 'IFC'}
                          </Button>
                        }
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
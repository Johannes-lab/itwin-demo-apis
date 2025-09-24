import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ArrowLeft, GitBranch, Clock, User, Download, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { IModel, Changeset, NamedVersion } from '../services/types';
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
    } catch (error) {
      return 'Invalid Date';
    }
  };

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
          {/* Create Named Version Button */}
          <div className="flex justify-end">
            <CreateNamedVersionModal
              iModelId={iModel.id}
              changesets={changesets}
              onNamedVersionCreated={handleNamedVersionCreated}
            />
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
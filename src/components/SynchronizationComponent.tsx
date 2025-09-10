import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { FileType, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { iTwinApiService, synchronizationService } from '../services';
import type { iTwin } from '../services/iTwinAPIService';
import type { ManifestConnection } from '../services/types';

export default function SynchronizationComponent() {
  // Basic skeleton state for creating a Manifest Connection and starting a Run
  const [iTwins, setITwins] = useState<iTwin[]>([]);
  const [iTwinsLoading, setITwinsLoading] = useState(false);
  const [selectedITwinId, setSelectedITwinId] = useState('');
  const [iModelId, setIModelId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [sourceFileId, setSourceFileId] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdConnection, setCreatedConnection] = useState<ManifestConnection | null>(null);
  const [runSubmitting, setRunSubmitting] = useState(false);
  const [runLocation, setRunLocation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setITwinsLoading(true); setError(null);
        const res = await iTwinApiService.getMyiTwins();
        setITwins(Array.isArray(res) ? res : []);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load iTwins';
        setError(msg);
      } finally { setITwinsLoading(false); }
    };
    load();
  }, []);

  const canCreate = !!iModelId && !!sourceFileId && !creating;
  const canRun = !!createdConnection && !runSubmitting;

  const createConnection = async () => {
    try {
      setCreating(true); setError(null); setRunLocation(null);
      const conn = await synchronizationService.createManifestConnection({
        displayName: displayName || undefined,
        iModelId: iModelId.trim(),
        authenticationType: 'User',
        sourceFiles: [{ sourceFileId: sourceFileId.trim() }],
      });
      setCreatedConnection(conn);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create connection';
      setError(msg);
    } finally { setCreating(false); }
  };

  const startRun = async () => {
    if (!createdConnection) return;
    try {
      setRunSubmitting(true); setError(null); setRunLocation(null);
      const res = await synchronizationService.createManifestConnectionRun(createdConnection.id);
      if (res.status === 202 || res.status === 303) {
        const loc = res.headers.get('Location'); setRunLocation(loc);
      } else if (res.status === 409) {
        setError('A run is already being processed for this iModel.');
      } else if (res.status === 401) {
        setError('Unauthorized. Check token/scope.');
      } else if (res.status === 403) {
        setError('Insufficient permissions.');
      } else if (res.status === 404) {
        setError('Connection not found.');
      } else if (res.status === 422) {
        setError('Invalid run request.');
      } else {
        setError(`Unexpected status ${res.status}`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to start run';
      setError(msg);
    } finally { setRunSubmitting(false); }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileType className="h-4 w-4"/> Manifest Connections</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="tw">iTwin</Label>
                <div className="flex gap-2 items-center">
                  <select id="tw" className="flex-1 border rounded px-2 py-1 text-sm bg-background" disabled={iTwinsLoading} value={selectedITwinId} onChange={e=>setSelectedITwinId(e.target.value)}>
                    <option value="">{iTwinsLoading ? 'Loading iTwins…' : 'Select an iTwin (optional)'}</option>
                    {iTwins.map(t => (<option key={t.id} value={t.id}>{t.displayName} ({t.id.slice(0,8)}…)</option>))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="im">iModel Id<span className="text-red-500 ml-0.5">*</span></Label>
                  <Input id="im" placeholder="7dbd531d-..." value={iModelId} onChange={e=>setIModelId(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sf">Source File Id<span className="text-red-500 ml-0.5">*</span></Label>
                  <Input id="sf" placeholder="t5bDFuN4..." value={sourceFileId} onChange={e=>setSourceFileId(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="dn">Display Name</Label>
                  <Input id="dn" placeholder="My Connection" value={displayName} onChange={e=>setDisplayName(e.target.value)} />
                </div>
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex items-center gap-2">
                <Button onClick={createConnection} disabled={!canCreate}>
                  {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}
                  Create ManifestConnection
                </Button>
                <Button variant="outline" onClick={startRun} disabled={!canRun}>
                  {runSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}
                  Start Run
                </Button>
              </div>
              {createdConnection && (
                <div className="text-xs text-muted-foreground">
                  Created connection: <span className="font-mono">{createdConnection.id}</span>
                </div>
              )}
              {runLocation && (
                <div className="text-xs">
                  Run Location: <a href={runLocation} target="_blank" rel="noreferrer" className="underline">{runLocation}</a>
                </div>
              )}
            </div>
          </CardContent>
  </Card>
    </div>
  );
}

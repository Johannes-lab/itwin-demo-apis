import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { AlertTriangle, RefreshCw, Search, Layers } from 'lucide-react';
import { realityManagementService } from '../services';
import type { RealityDataSummary, RealityDataListResponse, RealityDataListParams } from '../services/types';

const RealityModelingComponent: React.FC = () => {
  const [items, setItems] = useState<RealityDataSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iTwinId, setITwinId] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [types, setTypes] = useState<string>('');
  const [top, setTop] = useState<number | undefined>(50);
  const [continuationToken, setContinuationToken] = useState<string | undefined>(undefined);

  const hasFilters = useMemo(() => !!iTwinId || !!searchText || !!types, [iTwinId, searchText, types]);

  const loadRealityData = async (opts?: { reset?: boolean; token?: string }) => {
    setLoading(true);
    setError(null);
    try {
  const params: Partial<RealityDataListParams> = {};
      if (iTwinId) params.iTwinId = iTwinId;
      if (searchText) params.$search = searchText;
      if (types) params.types = types;
      if (top) params.$top = top;
      if (opts?.token) params.continuationToken = opts.token;

      const res = await realityManagementService.listRealityData(params);
      const data: RealityDataListResponse = res;
      setItems((prev) => (opts?.reset ? data.realityData : [...prev, ...data.realityData]));
      const next = data._links?.next?.href;
      setContinuationToken(next ? new URL(next).searchParams.get('continuationToken') || undefined : undefined);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to load reality data';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initial load: no iTwinId gets all accessible data
    loadRealityData({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onApplyFilters = () => loadRealityData({ reset: true });
  const onClearFilters = () => {
    setITwinId('');
    setSearchText('');
    setTypes('');
    setTop(50);
    loadRealityData({ reset: true });
  };

  const canLoadMore = Boolean(continuationToken);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reality Data</h1>
          <p className="text-muted-foreground">Browse reality data you have access to. Filter by iTwin, type, or search.</p>
        </div>
        <Button onClick={() => loadRealityData({ reset: true })} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded border border-red-300 bg-red-50 p-3 text-red-700">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Filters</CardTitle>
          <CardDescription>Use iTwinId for exhaustive results. Leave empty to list all accessible reality data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label htmlFor="itwinId">iTwin Id (optional)</Label>
              <Input id="itwinId" placeholder="00000000-0000-0000-0000-000000000000" value={iTwinId} onChange={(e) => setITwinId(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="search">Search</Label>
              <div className="flex gap-2">
                <Input id="search" placeholder="Search by name" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
                <Button variant="secondary" onClick={onApplyFilters}><Search className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="types">Types (comma-separated)</Label>
              <Input id="types" placeholder="OPC,Cesium3DTiles,OMR" value={types} onChange={(e) => setTypes(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="top">$top</Label>
              <Input id="top" type="number" min={1} max={1000} value={top ?? ''} onChange={(e) => setTop(e.target.value ? Math.min(1000, Math.max(1, Number(e.target.value))) : undefined)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={onApplyFilters} disabled={loading}>Apply</Button>
            <Button variant="outline" onClick={onClearFilters} disabled={loading || !hasFilters}>Clear</Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="space-y-3">
        {items.length === 0 && !loading && (
          <div className="text-center text-muted-foreground py-10">No reality data found.</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((rd) => (
            <Card key={rd.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="truncate" title={rd.displayName}>{rd.displayName || 'Unnamed reality data'}</span>
                  <Badge variant="secondary" className="ml-2 inline-flex items-center gap-1">
                    <Layers className="h-3 w-3" /> {rd.type}
                  </Badge>
                </CardTitle>
                <CardDescription className="truncate" title={rd.id}>ID: {rd.id}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {rd.createdDateTime && <div>Created: {new Date(rd.createdDateTime).toLocaleString()}</div>}
                {rd.modifiedDateTime && <div>Modified: {new Date(rd.modifiedDateTime).toLocaleString()}</div>}
                {rd.dataCenterLocation && <div>Data Center: {rd.dataCenterLocation}</div>}
                {rd.tags && rd.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {rd.tags.slice(0, 5).map((t, idx) => (
                      <Badge variant="outline" key={idx} className="text-[10px]">{t}</Badge>
                    ))}
                    {rd.tags.length > 5 && (
                      <Badge variant="outline" className="text-[10px]">+{rd.tags.length - 5} more</Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-center">
          <Button onClick={() => loadRealityData({ token: continuationToken })} disabled={!canLoadMore || loading} variant="outline">
            {loading ? 'Loading...' : canLoadMore ? 'Load More' : 'No more results'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RealityModelingComponent;


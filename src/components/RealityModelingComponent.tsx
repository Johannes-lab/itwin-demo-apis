import React, { useState, useEffect, useMemo, useCallback } from 'react';
type BaseCategory = 'CCImageCollection' | 'CCOrientations' | 'ScanCollection';
const CATEGORY_BASE_TYPES: readonly BaseCategory[] = ['CCImageCollection','CCOrientations','ScanCollection'];
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { AlertTriangle, RefreshCw, Layers, Plus, Loader2 } from 'lucide-react';
import { realityManagementService, realityModelingService, iTwinApiService } from '../services';
import type { RealityDataSummary, RealityDataListResponse, RealityDataListParams, Workspace, Job, iTwin } from '../services/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';

//constants
const TOP = 50;
const OUTPUT_FORMATS = [
  'CCOrientations','3MX','3SM','WebReady ScalableMesh','Cesium 3D Tiles','POD','Orthophoto/DSM','LAS','FBX','OBJ','ESRI i3s','DGN','LODTreeExport','PLY','OPC','OMR','ContextScene','GaussianSplats'
];
const BACKOFFS = [15,30,60,120];
const CATEGORY_FILTERS: { key: CategoryFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'CCImageCollection', label: 'CC Image Collections' },
  { key: 'CCOrientations', label: 'CC Orientations' },
  { key: 'ScanCollection', label: 'Scan Collections' },
  { key: 'RECONSTRUCTIONS', label: 'Reconstructions (Other)' }
];

interface AddListProps {
  label: string;
  items: RealityDataSummary[];
  loading: boolean;
  selected: Set<string>;
  setSelected: React.Dispatch<React.SetStateAction<Set<string>>>;
  selectValue: string;
  setSelectValue: (v: string) => void;
  placeholder: string;
}
const MultiAddSelect: React.FC<AddListProps> = ({ label, items, loading, selected, setSelected, selectValue, setSelectValue, placeholder }) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    {loading ? <div className="text-xs text-muted-foreground">Loading...</div> : items.length === 0 ? <div className="text-xs text-muted-foreground">None found</div> : (
      <div className="flex flex-wrap gap-2 items-center">
        <Select value={selectValue} onValueChange={setSelectValue}>
          <SelectTrigger className="min-w-[220px]"><SelectValue placeholder={placeholder} /></SelectTrigger>
          <SelectContent>
            {items.map(rd => <SelectItem key={rd.id} value={rd.id}>{rd.displayName || rd.id.slice(0,12)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button
          type="button"
          size="sm"
          onClick={() => { if (selectValue && !selected.has(selectValue)) { setSelected(new Set([...selected, selectValue])); setSelectValue(''); } }}
          disabled={!selectValue || selected.has(selectValue)}
        >Add</Button>
        <div className="flex flex-wrap gap-1">
          {Array.from(selected).map(id => (
            <Badge key={id} variant="secondary" className="flex items-center gap-1">
              <span>{items.find(i=>i.id===id)?.displayName || id.slice(0,8)}</span>
              <button type="button" className="text-xs" onClick={()=>{ const next = new Set(selected); next.delete(id); setSelected(next); }}>×</button>
            </Badge>
          ))}
        </div>
      </div>
    )}
  </div>
);

interface OrientationSelectProps {
  items: RealityDataSummary[]; loading: boolean; value: string; onChange:(v:string)=>void;
}
const OrientationSelect: React.FC<OrientationSelectProps> = ({ items, loading, value, onChange }) => (
  <div className="space-y-2">
    <Label>CCOrientations (required)</Label>
    {loading ? <div className="text-xs text-muted-foreground">Loading...</div> : items.length === 0 ? <div className="text-xs text-muted-foreground">None found</div> : (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="min-w-[260px]"><SelectValue placeholder="Select orientation" /></SelectTrigger>
        <SelectContent>
          {items.map(rd => <SelectItem key={rd.id} value={rd.id}>{rd.displayName || rd.id.slice(0,12)}</SelectItem>)}
        </SelectContent>
      </Select>
    )}
    {!value && <p className="text-[10px] text-red-500">Orientation required</p>}
  </div>
);

type CategoryFilter = 'ALL' | BaseCategory | 'RECONSTRUCTIONS';

const RealityModelingComponent: React.FC = () => {
  const [items, setItems] = useState<RealityDataSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [types, setTypes] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');
  const [continuationToken, setContinuationToken] = useState<string | undefined>();

  const loadRealityData = async (opts?: { reset?: boolean; token?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const params: Partial<RealityDataListParams> = {};
      if (types) params.types = types;
      params.$top = TOP;
      if (opts?.token) params.continuationToken = opts.token;

      const res = await realityManagementService.listRealityData(params);
      const data: RealityDataListResponse = res;
      setItems(prev => (opts?.reset ? data.realityData : [...prev, ...data.realityData]));
      const next = data._links?.next?.href;
      setContinuationToken(next ? new URL(next).searchParams.get('continuationToken') || undefined : undefined);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load reality data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRealityData({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayItems = useMemo(() => {
    if (categoryFilter === 'RECONSTRUCTIONS') {
      return items.filter(i => !CATEGORY_BASE_TYPES.includes(i.type as BaseCategory));
    }
    if (CATEGORY_BASE_TYPES.includes(categoryFilter as BaseCategory)) {
      return items.filter(i => i.type === categoryFilter);
    }
    return items;
  }, [items, categoryFilter]);

  const selectCategory = (cat: CategoryFilter) => {
    setCategoryFilter(cat);
    if (cat === 'ALL' || cat === 'RECONSTRUCTIONS') setTypes(''); else setTypes(cat);
    loadRealityData({ reset: true });
  };

  const canLoadMore = Boolean(continuationToken);

  //Reconstruction workflow
  const [newReconOpen, setNewReconOpen] = useState(false);
  const [step, setStep] = useState<1|2|3|4>(1); //1 workspace, 2 job config, 3 review+submit, 4 progress
  const [workspaceName, setWorkspaceName] = useState('');
  const [iTwins, setITwins] = useState<iTwin[]>([]);
  const [iTwinsLoading, setITwinsLoading] = useState(false);
  const [selectedITwinId, setSelectedITwinId] = useState('');
  const [createdWorkspace, setCreatedWorkspace] = useState<Workspace | null>(null);
  const [jobName, setJobName] = useState('');
  const [availableImageCollections, setAvailableImageCollections] = useState<RealityDataSummary[]>([]);
  const [availableScanCollections, setAvailableScanCollections] = useState<RealityDataSummary[]>([]);
  const [availableOrientations, setAvailableOrientations] = useState<RealityDataSummary[]>([]);
  const [inputsLoading, setInputsLoading] = useState(false);
  const [selectedImageCollections, setSelectedImageCollections] = useState<Set<string>>(new Set());
  const [selectedScanCollections, setSelectedScanCollections] = useState<Set<string>>(new Set());
  const [selectedOrientationId, setSelectedOrientationId] = useState('');
  const [meshQuality, setMeshQuality] = useState<'Draft' | 'Medium' | 'Extra'>('Draft');
  const [processingEngines, setProcessingEngines] = useState<number>(0);
  const [outputsList, setOutputsList] = useState<string[]>(['OBJ']);
  const [outputSelection, setOutputSelection] = useState('');
  const [imageSelectValue, setImageSelectValue] = useState('');
  const [scanSelectValue, setScanSelectValue] = useState('');
  const [creating, setCreating] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progressPct, setProgressPct] = useState<number | null>(null);
  const [progressState, setProgressState] = useState<string>('');
  const [progressStep, setProgressStep] = useState<string>('');
  const [progressError, setProgressError] = useState<string | null>(null);

  const resetWorkflow = useCallback(() => {
    setStep(1);
    setWorkspaceName('');
    setCreatedWorkspace(null);
    setJobName('');
    setAvailableImageCollections([]);
    setAvailableScanCollections([]);
    setAvailableOrientations([]);
    setSelectedImageCollections(new Set());
    setSelectedScanCollections(new Set());
    setSelectedOrientationId('');
    setMeshQuality('Draft');
    setProcessingEngines(0);
    setOutputsList(['OBJ']);
    setOutputSelection('');
    setCreating(false);
    setJob(null);
    setSubmitting(false);
    setProgressPct(null);
    setProgressState('');
    setProgressStep('');
    setProgressError(null);
  }, []);

  const openNewRecon = () => { resetWorkflow(); setNewReconOpen(true); loadITwins(); };

  const loadITwins = async () => {
    setITwinsLoading(true);
    try {
      const data = await iTwinApiService.getMyiTwins();
      if (data) setITwins(data);
    } finally { setITwinsLoading(false); }
  };

  const createWorkspace = async () => {
    if (!workspaceName.trim() || !selectedITwinId) return;
    setCreating(true);
    try {
      const ws = await realityModelingService.createWorkspace(workspaceName, selectedITwinId);
      if (ws) {
        setCreatedWorkspace(ws);
  setStep(2);
  loadInputRealityData();
      }
    } finally {
      setCreating(false);
    }
  };

  const createJob = async () => {
    if (!createdWorkspace) return;
    if (!jobName.trim() || !selectedOrientationId) return;
    setCreating(true);
    try {
      const inputs = [
        ...Array.from(selectedImageCollections).map(id => ({ id, description: 'Image Collection' })),
        ...Array.from(selectedScanCollections).map(id => ({ id, description: 'Scan Collection' })),
        { id: selectedOrientationId, description: 'Orientations' },
      ];
      const jobReq = {
        type: 'Full' as const,
        name: jobName,
        workspaceId: createdWorkspace.id,
        inputs,
        costEstimationParameters: {
          gigaPixels: undefined,
          megaPoints: undefined,
          meshQuality,
        },
        settings: {
          quality: meshQuality,
          processingEngines,
          outputs: outputsList,
        },
      };
      const newJob = await realityModelingService.createJob(jobReq);
      if (newJob) {
        setJob(newJob);
        setStep(3);
      }
    } finally {
      setCreating(false);
    }
  };

  const submitJob = async () => {
    if (!job) return;
    setSubmitting(true);
    try {
      const updated = await realityModelingService.submitJob(job.id);
      if (updated) {
        setJob(updated);
        setStep(4);
        pollProgress(updated.id);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const pollProgress = async (jobId: string) => {
    let idx = 0; let lastPct: number | null = null;
    const loop = async () => {
      const prog = await realityModelingService.getJobProgress(jobId);
      if (!prog) { setProgressError('Failed to fetch progress'); return; }
      setProgressPct(prog.percentage); setProgressState(prog.state); setProgressStep(prog.step);
      if (lastPct !== prog.percentage) { idx = 0; lastPct = prog.percentage; }
      const done = ['completed','failed','success'].includes(prog.state.toLowerCase()) || prog.percentage === 100;
      if (done) { loadRealityData({ reset: true }); return; }
      const delay = (BACKOFFS[idx] || BACKOFFS[BACKOFFS.length-1]) * 1000; if (idx < BACKOFFS.length - 1) idx++;
      setTimeout(loop, delay);
    }; loop();
  };

  const loadInputRealityData = async () => {
    setInputsLoading(true);
    try {
      const baseParams = selectedITwinId ? { iTwinId: selectedITwinId, $top: 100 } : { $top: 100 };
      const [img, scan, orient] = await Promise.all([
        realityManagementService.listRealityData({ ...baseParams, types: 'CCImageCollection' }),
        realityManagementService.listRealityData({ ...baseParams, types: 'ScanCollection' }),
        realityManagementService.listRealityData({ ...baseParams, types: 'CCOrientations' }),
      ]);
      if (img) setAvailableImageCollections(img.realityData);
      if (scan) setAvailableScanCollections(scan.realityData);
      if (orient) setAvailableOrientations(orient.realityData);
    } catch (e) {
      console.error('Failed to load input reality data', e);
    } finally { setInputsLoading(false); }
  };


  const addOutputFormat = () => {
    if (outputSelection && !outputsList.includes(outputSelection)) {
      setOutputsList(prev => [...prev, outputSelection]);
      setOutputSelection('');
    }
  };

  const removeOutput = (fmt: string) => {
    setOutputsList(prev => prev.filter(f => f !== fmt));
  };

  return (
    <>
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reality Data</h1>
          <p className="text-muted-foreground">Browse reality data you have access to.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => loadRealityData({ reset: true })} disabled={loading} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button onClick={openNewRecon}>
            <Plus className="mr-2 h-4 w-4" /> New Reconstruction
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded border border-red-300 bg-red-50 p-3 text-red-700">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {CATEGORY_FILTERS.map(btn => (
          <Button key={btn.key} type="button" variant={categoryFilter === btn.key ? 'default':'outline'} size="sm" onClick={()=>selectCategory(btn.key)} disabled={loading && categoryFilter===btn.key}>{btn.label}</Button>
        ))}
      </div>

      <div className="space-y-3">
        {displayItems.length === 0 && !loading && (
          <div className="text-center text-muted-foreground py-10">No reality data found.</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayItems.map(rd => (
            <Card key={rd.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="truncate block" title={rd.displayName}>{rd.displayName || 'Unnamed reality data'}</span>
                    </div>
                    <Badge variant="secondary" className="flex-shrink-0 inline-flex items-center gap-1 whitespace-nowrap">
                      <Layers className="h-3 w-3" /> {rd.type}
                    </Badge>
                  </div>
                </CardTitle>
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
  <Dialog open={newReconOpen} onOpenChange={(o)=>{ setNewReconOpen(o); if(!o) resetWorkflow(); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>New Reconstruction Workflow</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">1. Create Workspace</h3>
              <div className="space-y-2">
                <Label htmlFor="wsName">Workspace Name</Label>
                <Input id="wsName" value={workspaceName} onChange={e=>setWorkspaceName(e.target.value)} placeholder="My workspace" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="itwinSel">Select iTwin</Label>
                <div className="flex gap-2">
                  <select id="itwinSel" className="flex-1 border rounded px-2 py-1 text-sm bg-background" value={selectedITwinId} onChange={e=>setSelectedITwinId(e.target.value)}>
                    <option value="">{iTwinsLoading ? 'Loading iTwins...' : 'Choose an iTwin'}</option>
                    {iTwins.map(t => (
                      <option key={t.id} value={t.id}>{t.displayName} ({t.id.slice(0,8)}…)</option>
                    ))}
                  </select>
                  <Button type="button" variant="outline" size="sm" onClick={loadITwins} disabled={iTwinsLoading}>
                    {iTwinsLoading && <Loader2 className="mr-1 h-3 w-3 animate-spin"/>}Reload
                  </Button>
                </div>
              </div>
              <Button onClick={createWorkspace} disabled={!workspaceName.trim() || creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Workspace
              </Button>
            </div>
          )}
          {step === 2 && createdWorkspace && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">2. Configure Job</h3>
              <p className="text-xs text-muted-foreground">Workspace: {createdWorkspace.name}</p>
              <div className="space-y-2">
                <Label htmlFor="jobName">Job Name</Label>
                <Input id="jobName" value={jobName} onChange={e=>setJobName(e.target.value)} placeholder="My reconstruction job" />
              </div>
              <Separator />
              <div className="space-y-6">
                <MultiAddSelect label="CCImageCollections" items={availableImageCollections} loading={inputsLoading} selected={selectedImageCollections} setSelected={setSelectedImageCollections} selectValue={imageSelectValue} setSelectValue={setImageSelectValue} placeholder="Select image collection" />
                <MultiAddSelect label="ScanCollections" items={availableScanCollections} loading={inputsLoading} selected={selectedScanCollections} setSelected={setSelectedScanCollections} selectValue={scanSelectValue} setSelectValue={setScanSelectValue} placeholder="Select scan collection" />
                <OrientationSelect items={availableOrientations} loading={inputsLoading} value={selectedOrientationId} onChange={setSelectedOrientationId} />
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Mesh Quality</Label>
                  <div className="flex gap-2 flex-wrap">
                    {(['Draft','Medium','Extra'] as const).map(q => (
                      <Button key={q} type="button" size="sm" variant={meshQuality===q? 'default':'outline'} onClick={()=>setMeshQuality(q)}>{q}</Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="engines">Processing Engines (0 = max)</Label>
                  <Input id="engines" type="number" min={0} value={processingEngines} onChange={e=>setProcessingEngines(Number(e.target.value))} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Outputs</Label>
                  <div className="flex gap-2 items-center">
                    <select className="border rounded px-2 py-1 text-sm" value={outputSelection} onChange={e=>setOutputSelection(e.target.value)}>
                      <option value="">Select format</option>
                      {OUTPUT_FORMATS.filter(f => !outputsList.includes(f)).map(fmt => (
                        <option key={fmt} value={fmt}>{fmt}</option>
                      ))}
                    </select>
                    <Button type="button" size="sm" onClick={addOutputFormat} disabled={!outputSelection}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {outputsList.map(fmt => (
                      <Badge key={fmt} variant="secondary" className="flex items-center gap-1">
                        <span>{fmt}</span>
                        {outputsList.length>1 && (
                          <button type="button" onClick={()=>removeOutput(fmt)} className="text-xs hover:text-red-600">×</button>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={()=>setStep(1)}>Back</Button>
                <Button onClick={createJob} disabled={!jobName.trim() || !selectedOrientationId || creating}>
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Job
                </Button>
              </DialogFooter>
            </div>
          )}
      {step === 3 && job && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">3. Review & Submit</h3>
              <div className="text-xs space-y-1 font-mono bg-muted p-3 rounded border">
                <div>Workspace: {createdWorkspace?.name}</div>
                <div>Job: {job.name}</div>
                <div>Type: {job.type}</div>
                <div>Quality: {meshQuality}</div>
                <div>Engines: {processingEngines}</div>
        <div>Outputs: {outputsList.join(', ')}</div>
        <div>Image Collections: {Array.from(selectedImageCollections).length}</div>
        <div>Scan Collections: {Array.from(selectedScanCollections).length}</div>
        <div>Orientation: {selectedOrientationId ? selectedOrientationId.slice(0,8)+'…' : ''}</div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={()=>setStep(2)}>Back</Button>
                <Button onClick={submitJob} disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit Job
                </Button>
              </DialogFooter>
            </div>
          )}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">4. Progress</h3>
              {progressError && <div className="text-sm text-red-600">{progressError}</div>}
              <div className="space-y-2">
                <div className="text-sm">State: {progressState || '...'}</div>
                <div className="text-sm">Step: {progressStep || '...'}</div>
                <div className="text-sm">Progress: {progressPct ?? 0}%</div>
                <div className="w-full h-2 bg-muted rounded overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${progressPct ?? 0}%`}} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Polling with backoff (15,30,60,120s). Closes automatically when completed.</p>
              <DialogFooter>
                <Button variant="outline" onClick={()=>setNewReconOpen(false)}>Close</Button>
              </DialogFooter>
            </div>
          )}
        </div>
      </DialogContent>
  </Dialog>
  </>
  );
};

export default RealityModelingComponent;

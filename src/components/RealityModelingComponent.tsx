import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { toast } from 'sonner';
type BaseCategory = 'CCImageCollection' | 'CCOrientations' | 'ScanCollection';
const CATEGORY_BASE_TYPES: readonly BaseCategory[] = ['CCImageCollection','CCOrientations','ScanCollection'];
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { AlertTriangle, RefreshCw, Layers, Plus, Loader2, ImagePlus, UploadCloud, FileCog, Link2 } from 'lucide-react';
import { buildOrientationsXml, buildOrientationsZip } from '../lib/orientations';
import { realityManagementService, realityModelingService, iTwinApiService } from '../services';
import type { RealityDataSummary, RealityDataListResponse, RealityDataListParams, Workspace, Job, iTwin } from '../services/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
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
  // Global iTwin selection (for filtering Reality Data list & preselecting reconstruction workflow)
  const [iTwins, setITwins] = useState<iTwin[]>([]);
  const [iTwinsLoading, setITwinsLoading] = useState(false);
  const [selectedITwinId, setSelectedITwinId] = useState<string>('');
  const [iTwinSearch, setITwinSearch] = useState<string>('');
  const [showITwinDropdown, setShowITwinDropdown] = useState(false);
  const [recentITwins, setRecentITwins] = useState<iTwin[]>([]);

  // Recent iTwins utilities (localStorage shared pattern but separate key for Reality page)
  const RECENT_REALITY_ITWINS_KEY = 'reality-recent-itwins';
  const loadRecentITwins = () => {
    try {
      const stored = localStorage.getItem(RECENT_REALITY_ITWINS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as iTwin[];
        setRecentITwins(parsed.slice(0, 5));
      }
    } catch (e) {
      console.warn('Failed to load recent reality iTwins', e);
    }
  };
  const addToRecentITwins = (tw: iTwin) => {
    try {
      const current = recentITwins.filter(r => r.id !== tw.id);
      const updated = [tw, ...current].slice(0, 5);
      setRecentITwins(updated);
      localStorage.setItem(RECENT_REALITY_ITWINS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save recent reality iTwin', e);
    }
  };

  const loadGlobalITwins = async () => {
    setITwinsLoading(true);
    try {
      const data = await iTwinApiService.getMyiTwins();
      if (data) setITwins(data);
    } catch (e) {
      console.error('Failed to load iTwins for Reality Data page', e);
    } finally {
      setITwinsLoading(false);
    }
  };

  const selectGlobalITwin = (tw: iTwin) => {
    setSelectedITwinId(tw.id);
    setITwinSearch(`${tw.displayName} (${tw.id.slice(0,8)}…)`);
    addToRecentITwins(tw);
    setShowITwinDropdown(false);
    loadRealityData({ reset: true });
  };

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
      if (selectedITwinId) params.iTwinId = selectedITwinId; // filter by selected iTwin if chosen

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
    loadRecentITwins();
    loadGlobalITwins().then(() => {
      // initial load after iTwins fetched (selectedITwinId might already be set if user previously navigated back)
      loadRealityData({ reset: true });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // when selected iTwin changes, reload (types/category already considered)
  useEffect(() => {
    if (selectedITwinId) {
      loadRealityData({ reset: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedITwinId]);

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

  // Reconstruction workflow (uses selectedITwinId from global selector if present)
  const [newReconOpen, setNewReconOpen] = useState(false);
  const [step, setStep] = useState<1|2|3|4>(1); //1 workspace, 2 job config, 3 review+submit, 4 progress
  const [workspaceName, setWorkspaceName] = useState('');
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

  // New Image Collection creation state
  const [newICOpen, setNewICOpen] = useState(false);
  const [newICName, setNewICName] = useState('');
  const [creatingIC, setCreatingIC] = useState(false);
  const [icError, setICError] = useState<string | null>(null);
  // New CCOrientations creation state
  const [newCOOpen, setNewCOOpen] = useState(false);
  const [newCOName, setNewCOName] = useState('');
  const [coFile, setCOFile] = useState<File | null>(null);
  const [creatingCO, setCreatingCO] = useState(false);
  const [coError, setCOError] = useState<string | null>(null);
  // Auto-generate CCOrientations from Image Collection
  const [genCOOpen, setGenCOOpen] = useState(false);
  const [genTargetIC, setGenTargetIC] = useState<RealityDataSummary | null>(null);
  const [genLoadingImages, setGenLoadingImages] = useState(false);
  const [genImages, setGenImages] = useState<string[]>([]);
  const [genBlockName, setGenBlockName] = useState('Generated Block');
  const [genCreating, setGenCreating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [genCOId, setGenCOId] = useState<string>('');

  const resetICForm = () => { setNewICName(''); setICError(null); };
  const resetCOForm = () => { setNewCOName(''); setCOFile(null); setCOError(null); };

  const submitCreateImageCollection = async () => {
    if (!selectedITwinId || !newICName.trim()) { setICError('iTwin and name required'); return; }
    setCreatingIC(true); setICError(null);
    try {
      const created = await realityManagementService.createRealityData({
        iTwinId: selectedITwinId,
        displayName: newICName.trim(),
        type: 'CCImageCollection',
        classification: 'Undefined'
      });
      if (created) {
        setNewICOpen(false);
        resetICForm();
        // reload list filtered by iTwin
        loadRealityData({ reset: true });
      } else {
        setICError('Creation failed');
      }
    } catch (e:any) {
      setICError(e.message || 'Unexpected error');
    } finally { setCreatingIC(false); }
  };

  const submitCreateCCOrientations = async () => {
    if (!selectedITwinId) { setCOError('Select an iTwin first'); return; }
    if (!newCOName.trim()) { setCOError('Display name required'); return; }
    if (!coFile) { setCOError('Orientation file required'); return; }
    setCreatingCO(true); setCOError(null);
    try {
      const created = await realityManagementService.createRealityData({
        iTwinId: selectedITwinId,
        displayName: newCOName.trim(),
        type: 'CCOrientations',
        classification: 'Undefined'
      });
      if (!created) { setCOError('Creation failed'); return; }
      toast.success('CCOrientations created', { description: created.id });
      // Get write access and upload the single orientations file
      const access = await realityManagementService.getRealityDataWriteAccess(selectedITwinId, created.id);
      if (!access?.containerUrl) { setCOError('Write access failed'); toast.error('Write access failed'); return; }
      // Build upload URL (reuse logic similar to images)
      let targetUrl: string;
      try {
        const u = new URL(access.containerUrl);
        const path = u.pathname.endsWith('/') ? u.pathname : u.pathname + '/';
        // If user file name doesn't look json, keep original; server conventions may expect orientations.json
        const desiredName = coFile.name.endsWith('.json') ? coFile.name : coFile.name;
        u.pathname = path + encodeURIComponent(desiredName);
        targetUrl = u.toString();
      } catch {
        const [b, q] = access.containerUrl.split('?');
        targetUrl = `${b.replace(/\/$/, '')}/${encodeURIComponent(coFile.name)}${q ? `?${q}` : ''}`;
      }
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', targetUrl, true);
        xhr.setRequestHeader('x-ms-blob-type','BlockBlob');
        if (coFile.type) try { xhr.setRequestHeader('Content-Type', coFile.type); } catch {}
        xhr.onerror = () => reject(new Error('Network error uploading orientations'));
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve(); else reject(new Error('Upload failed ' + xhr.status));
        };
        xhr.send(coFile);
      });
      toast.success('Orientations uploaded', { description: 'File stored successfully.' });
      // Refresh list and close
      loadRealityData({ reset: true });
      setNewCOOpen(false); resetCOForm();
    } catch (e:any) {
      const msg = e.message || 'Unexpected error';
      setCOError(msg);
      toast.error('CCOrientations error', { description: msg });
    } finally {
      setCreatingCO(false);
    }
  };

  const openGenerateCO = async (ic: RealityDataSummary) => {
    if (!selectedITwinId) { toast.error('Select iTwin first'); return; }
    setGenTargetIC(ic);
    setGenImages([]); setGenError(null); setGenCOId('');
    setGenCOOpen(true);
    // Obtain list of images via write access listing (read access might differ; reuse write for simplicity)
    setGenLoadingImages(true);
    try {
      const access = await realityManagementService.getRealityDataWriteAccess(selectedITwinId, ic.id);
      if (!access?.containerUrl) throw new Error('Write access failed');
      // List container
      const hasQuery = access.containerUrl.includes('?');
      const listUrl = access.containerUrl + (hasQuery ? '&' : '?') + 'restype=container&comp=list';
      const res = await fetch(listUrl);
      if (!res.ok) throw new Error('List failed ' + res.status);
      const xml = await res.text();
      const names: string[] = [];
      const blobRegex = /<Blob>(.*?)<\/Blob>/gs; let m: RegExpExecArray | null;
      while ((m = blobRegex.exec(xml))) {
        const seg = m[1];
        const nameMatch = /<Name>(.*?)<\/Name>/s.exec(seg);
        if (nameMatch) {
          const name = nameMatch[1];
          if (/\.(jpe?g|png|tif|tiff|bmp)$/i.test(name)) names.push(name.split('/').pop() || name);
        }
      }
      if (names.length === 0) setGenError('No image files found in collection container.');
      setGenImages(names);
    } catch (e:any) {
      setGenError(e.message || 'Failed to list images');
    } finally {
      setGenLoadingImages(false);
    }
  };

  const generateOrientations = async () => {
    if (!genTargetIC || !selectedITwinId) return;
    if (genImages.length === 0) { setGenError('No images to reference'); return; }
    setGenCreating(true); setGenError(null);
    try {
      // Create CCOrientations reality data first
      const created = await realityManagementService.createRealityData({
        iTwinId: selectedITwinId,
        displayName: `${genTargetIC.displayName || genTargetIC.id}-CO`,
        type: 'CCOrientations',
        classification: 'Undefined'
      });
      if (!created) throw new Error('Creation failed');
      setGenCOId(created.id);
      // Build XML referencing all images
      const xml = buildOrientationsXml(genTargetIC.id, genImages, { blockName: genBlockName });
      const zipBlob = await buildOrientationsZip(xml);
      const access = await realityManagementService.getRealityDataWriteAccess(selectedITwinId, created.id);
      if (!access?.containerUrl) throw new Error('Write access for orientations failed');
      // Upload Orientations.xmlz
      let targetUrl: string;
      try {
        const u = new URL(access.containerUrl);
        const p = u.pathname.endsWith('/') ? u.pathname : u.pathname + '/';
        u.pathname = p + 'Orientations.xmlz';
        targetUrl = u.toString();
      } catch {
        const [b,q] = access.containerUrl.split('?');
        targetUrl = `${b.replace(/\/$/,'')}/Orientations.xmlz${q?`?${q}`:''}`;
      }
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', targetUrl, true);
        xhr.setRequestHeader('x-ms-blob-type','BlockBlob');
        xhr.onload = () => { if (xhr.status>=200 && xhr.status<300) resolve(); else reject(new Error('Upload failed '+xhr.status)); };
        xhr.onerror = () => reject(new Error('Network error uploading Orientations.xmlz'));
        xhr.send(zipBlob);
      });
      toast.success('Generated CCOrientations', { description: created.id });
      loadRealityData({ reset: true });
    } catch (e:any) {
      const msg = e.message || 'Generation failed';
      setGenError(msg);
      toast.error('Generation error', { description: msg });
    } finally {
      setGenCreating(false);
    }
  };

  // Upload images to image collection
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<RealityDataSummary | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [containerUrl, setContainerUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [containerListing, setContainerListing] = useState<{ name:string; size:number }[]>([]);
  const [listingLoading, setListingLoading] = useState(false);
  const [listingError, setListingError] = useState<string | null>(null);

  const loadContainerListing = useCallback(async () => {
    if (!containerUrl) return;
    setListingLoading(true); setListingError(null);
    try {
      // Azure Blob list: append restype=container&comp=list preserving SAS query
      const hasQuery = containerUrl.includes('?');
      const listUrl = containerUrl + (hasQuery ? '&' : '?') + 'restype=container&comp=list';
      const res = await fetch(listUrl);
      if (!res.ok) throw new Error('List failed ' + res.status);
      const xml = await res.text();
      const items: { name:string; size:number }[] = [];
      const blobRegex = /<Blob>(.*?)<\/Blob>/gs;
      let match: RegExpExecArray | null;
      while ((match = blobRegex.exec(xml))) {
        const segment = match[1];
        const nameMatch = /<Name>(.*?)<\/Name>/s.exec(segment);
        const sizeMatch = /<Content-Length>(.*?)<\/Content-Length>/s.exec(segment);
        if (nameMatch) {
          items.push({ name: nameMatch[1], size: sizeMatch ? parseInt(sizeMatch[1],10) : 0 });
        }
      }
      setContainerListing(items);
    } catch (e:any) {
      setListingError(e.message || 'Failed to list');
    } finally {
      setListingLoading(false);
    }
  }, [containerUrl]);

  const openUploadDialog = async (rd: RealityDataSummary) => {
    if (!selectedITwinId) { setUploadError('Select an iTwin filter first.'); return; }
    setUploadTarget(rd);
    setSelectedFiles([]);
    setUploadProgress({});
    setUploadError(null);
    setContainerUrl(null);
    setContainerListing([]);
    setListingError(null);
    setUploadOpen(true);
    // Fetch write access immediately
    const access = await realityManagementService.getRealityDataWriteAccess(selectedITwinId, rd.id);
    if (access?.containerUrl) {
      setContainerUrl(access.containerUrl);
      toast.success('Write access ready', { description: 'Select images to upload.' });
      loadContainerListing();
    } else {
      setUploadError('Failed to obtain write access URL (404 or unsupported type)');
      toast.error('Write access failed', { description: 'Could not obtain SAS URL.' });
    }
  };

  const onSelectFiles = (files: FileList | null) => {
    if (!files) return;
    setSelectedFiles(Array.from(files));
  };

  const uploadAll = async () => {
    if (!containerUrl || selectedFiles.length === 0) return;
    setUploading(true); setUploadError(null);
    try {
      let successCount = 0;
      for (const file of selectedFiles) {
        // Correctly insert filename BEFORE SAS query string (previous logic placed filename after query causing 403)
        let fileUrl: string;
        try {
          const urlObj = new URL(containerUrl);
          const path = urlObj.pathname.endsWith('/') ? urlObj.pathname : urlObj.pathname + '/';
          // Avoid double-encoding forward slashes; encode only filename
          urlObj.pathname = path + encodeURIComponent(file.name);
          fileUrl = urlObj.toString();
        } catch {
          // Fallback (should not happen): naive split on '?' preserving query
            const [base, qs] = containerUrl.split('?');
            fileUrl = `${base.replace(/\/$/, '')}/${encodeURIComponent(file.name)}${qs ? `?${qs}` : ''}`;
        }

        // Use XMLHttpRequest for progress (simpler than streaming fetch here)
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
            xhr.open('PUT', fileUrl, true);
            xhr.setRequestHeader('x-ms-blob-type','BlockBlob'); // Azure style; harmless if not Azure
            // Content-Type helps some viewers and may be required for certain processing
            if (file.type) try { xhr.setRequestHeader('Content-Type', file.type); } catch {}
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                setUploadProgress(prev => ({ ...prev, [file.name]: Math.round((e.loaded / e.total) * 100) }));
              }
            };
            xhr.onerror = () => reject(new Error('Network error uploading ' + file.name));
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
                successCount++;
                resolve();
              } else {
                let msg = `Upload failed (${xhr.status}) for ${file.name}`;
                if (xhr.status === 403) {
                  msg += ' - SAS token may have expired or URL malformed.';
                }
                reject(new Error(msg));
              }
            };
            xhr.send(file);
        });
      }
      loadRealityData({ reset: true });
      await loadContainerListing();
      toast.success('Upload complete', { description: `${successCount} file(s) uploaded.` });
    } catch (e:any) {
      setUploadError(e.message || 'Upload failed');
      toast.error('Upload error', { description: e.message });
    } finally {
      setUploading(false);
    }
  };

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
          <Button variant="outline" onClick={()=>{ resetICForm(); setNewICOpen(true); }} disabled={iTwinsLoading}>
            <ImagePlus className="mr-2 h-4 w-4" /> New Image Collection
          </Button>
          <Button onClick={openNewRecon}>
            <Plus className="mr-2 h-4 w-4" /> New Reconstruction
          </Button>
        </div>
      </div>

      {/* Global iTwin selector */}
      <div className="space-y-2">
        <Label htmlFor="global-itwin">Filter by iTwin (optional)</Label>
        <div className="relative">
          <Input
            id="global-itwin"
            placeholder={iTwinsLoading ? 'Loading iTwins…' : 'Search or select an iTwin'}
            value={iTwinSearch}
            onChange={e => { setITwinSearch(e.target.value); setShowITwinDropdown(true); setSelectedITwinId(''); }}
            onFocus={() => setShowITwinDropdown(true)}
            onBlur={() => setTimeout(() => setShowITwinDropdown(false), 150)}
            disabled={iTwinsLoading}
            className="pr-8"
          />
          {selectedITwinId && iTwinSearch && (
            <button
              type="button"
              onClick={() => { setSelectedITwinId(''); setITwinSearch(''); setShowITwinDropdown(false); loadRealityData({ reset: true }); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >×</button>
          )}
          {showITwinDropdown && !iTwinsLoading && (
            <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto text-sm">
              {!iTwinSearch && recentITwins.length > 0 && (
                <>
                  <div className="px-3 py-1 text-xs font-medium text-muted-foreground bg-muted/50 border-b">Recent iTwins</div>
                  {recentITwins.map(t => (
                    <div
                      key={`recent-${t.id}`}
                      className="px-3 py-2 hover:bg-muted cursor-pointer flex justify-between"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => selectGlobalITwin(t)}
                    >
                      <span className="truncate">{t.displayName}</span>
                      <span className="text-xs text-muted-foreground">({t.id.slice(0,8)}…)</span>
                    </div>
                  ))}
                  {iTwins.length > 0 && <div className="px-3 py-1 text-xs font-medium text-muted-foreground bg-muted/50 border-b">All iTwins</div>}
                </>
              )}
              {iTwins
                .filter(t => !iTwinSearch || t.displayName.toLowerCase().includes(iTwinSearch.toLowerCase()) || t.id.toLowerCase().includes(iTwinSearch.toLowerCase()))
                .slice(0, iTwinSearch ? 25 : 12)
                .map(t => (
                  <div
                    key={t.id}
                    className="px-3 py-2 hover:bg-muted cursor-pointer flex justify-between"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => selectGlobalITwin(t)}
                  >
                    <span className="truncate">{t.displayName}</span>
                    <span className="text-xs text-muted-foreground">({t.id.slice(0,8)}…)</span>
                  </div>
                ))}
              {iTwins.length === 0 && !iTwinSearch && (
                <div className="px-3 py-2 text-muted-foreground">No iTwins available</div>
              )}
              {iTwins.filter(t => t.displayName.toLowerCase().includes(iTwinSearch.toLowerCase()) || t.id.toLowerCase().includes(iTwinSearch.toLowerCase())).length === 0 && iTwinSearch && (
                <div className="px-3 py-2 text-muted-foreground">No iTwins match "{iTwinSearch}"</div>
              )}
            </div>
          )}
        </div>
        {selectedITwinId && (
          <p className="text-xs text-muted-foreground">Filtering reality data for iTwin <span className="font-mono">{selectedITwinId}</span></p>
        )}
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
        <Button type="button" size="sm" variant="outline" onClick={()=>setNewICOpen(true)} className="inline-flex items-center gap-1"><ImagePlus className="h-3 w-3" /> New Image Collection</Button>
        <Button type="button" size="sm" variant="outline" onClick={()=>setNewCOOpen(true)} className="inline-flex items-center gap-1"><FileCog className="h-3 w-3" /> New CCOrientations</Button>
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
                {rd.type === 'CCImageCollection' && (
                  <div className="pt-1">
                    <Button variant="outline" size="sm" onClick={()=>openUploadDialog(rd)} disabled={!selectedITwinId}>
                      <UploadCloud className="h-3 w-3 mr-1" /> Upload Images
                    </Button>
                    <Button variant="outline" size="sm" className="ml-2" onClick={()=>openGenerateCO(rd)} disabled={!selectedITwinId}>
                      <Link2 className="h-3 w-3 mr-1" /> Gen Orientations
                    </Button>
                    {!selectedITwinId && <p className="text-[10px] text-muted-foreground mt-1">Select iTwin to enable upload</p>}
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
          <DialogDescription>
            Create a workspace, choose inputs, configure job options, and submit for processing.
          </DialogDescription>
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
  <Dialog open={newICOpen} onOpenChange={(o)=>{ setNewICOpen(o); if(!o) resetICForm(); }}>
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle>Create Image Collection</DialogTitle>
        <DialogDescription>Creates a CCImageCollection reality data item in the selected iTwin.</DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="ic-name">Display Name<span className="text-red-500 ml-0.5">*</span></Label>
          <Input id="ic-name" value={newICName} onChange={e=>setNewICName(e.target.value)} placeholder="My Image Collection" />
        </div>
        {!selectedITwinId && <p className="text-xs text-amber-600">Select an iTwin first (top of page).</p>}
        {icError && <p className="text-xs text-red-600">{icError}</p>}
      </div>
      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={()=>{ setNewICOpen(false); resetICForm(); }} disabled={creatingIC}>Cancel</Button>
        <Button onClick={submitCreateImageCollection} disabled={creatingIC || !newICName.trim() || !selectedITwinId}>
          {creatingIC && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  <Dialog open={newCOOpen} onOpenChange={(o)=>{ setNewCOOpen(o); if(!o) resetCOForm(); }}>
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle>Create CCOrientations</DialogTitle>
        <DialogDescription>Creates a CCOrientations reality data item then uploads the orientation file.</DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="co-name">Display Name<span className="text-red-500 ml-0.5">*</span></Label>
          <Input id="co-name" value={newCOName} onChange={e=>setNewCOName(e.target.value)} placeholder="My Orientations" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="co-file">Orientation File<span className="text-red-500 ml-0.5">*</span></Label>
          <Input id="co-file" type="file" accept=".json,.txt,application/json,text/plain" onChange={e=>setCOFile(e.target.files?.[0]||null)} />
          {coFile && <p className="text-[10px] text-muted-foreground">Selected: {coFile.name} ({(coFile.size/1024).toFixed(1)} KB)</p>}
        </div>
        {!selectedITwinId && <p className="text-xs text-amber-600">Select an iTwin first (top of page).</p>}
        {coError && <p className="text-xs text-red-600">{coError}</p>}
      </div>
      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={()=>{ setNewCOOpen(false); resetCOForm(); }} disabled={creatingCO}>Cancel</Button>
        <Button onClick={submitCreateCCOrientations} disabled={creatingCO || !newCOName.trim() || !selectedITwinId || !coFile}>
          {creatingCO && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create & Upload
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  <Dialog open={genCOOpen} onOpenChange={(o)=>{ setGenCOOpen(o); if(!o){ setGenTargetIC(null); setGenImages([]); setGenError(null); setGenCOId(''); } }}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Generate CCOrientations</DialogTitle>
        <DialogDescription>Create & upload Orientations.xmlz referencing all images in this image collection.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        {genTargetIC && <p className="text-xs">Image Collection: <span className="font-mono">{genTargetIC.id}</span></p>}
        <div className="space-y-1">
          <Label htmlFor="gen-block">Block Name</Label>
          <Input id="gen-block" value={genBlockName} onChange={e=>setGenBlockName(e.target.value)} />
        </div>
        {genError && <p className="text-xs text-red-600">{genError}</p>}
        {genLoadingImages && <div className="text-xs flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Listing images…</div>}
        {!genLoadingImages && genImages.length > 0 && (
          <div className="border rounded p-2 max-h-40 overflow-auto text-[11px] space-y-1">
            {genImages.slice(0,120).map((n,i)=>(<div key={i} className="flex justify-between"><span className="truncate max-w-[70%]" title={n}>{n}</span><span>{i}</span></div>))}
            {genImages.length>120 && <div className="text-muted-foreground">… {genImages.length-120} more</div>}
          </div>
        )}
        {genCOId && <p className="text-xs text-green-600">Created CCOrientations ID: <span className="font-mono">{genCOId}</span></p>}
      </div>
      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={()=>setGenCOOpen(false)} disabled={genCreating}>Close</Button>
        <Button onClick={generateOrientations} disabled={genCreating || genImages.length===0 || !genBlockName.trim()}>
          {genCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Generate & Upload
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  <Dialog open={uploadOpen} onOpenChange={(o)=>{ setUploadOpen(o); if(!o){ setUploadTarget(null); setSelectedFiles([]); setUploadProgress({}); setUploadError(null);} }}>
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Upload Images</DialogTitle>
        <DialogDescription>
          {uploadTarget ? `Add image files to ${uploadTarget.displayName || uploadTarget.id}` : 'Select images to upload.'}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
  {!containerUrl && !uploadError && <p className="text-xs text-muted-foreground">Requesting write access… (ensure the reality data is of type CCImageCollection and you have modify scope)</p>}
        {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
        <div>
          {/* Hidden native input; triggered by button for better UX */}
          <input
            ref={fileInputRef}
            className="hidden"
            type="file"
            multiple
            accept="image/*"
            onChange={e=>onSelectFiles(e.target.files)}
            disabled={!containerUrl || uploading}
          />
          {(!containerUrl && !uploadError) ? (
            // Skeleton / disabled state while awaiting write access
            <Button variant="outline" size="sm" disabled className="w-[160px] justify-center">
              <Loader2 className="h-3 w-3 mr-2 animate-spin" /> Preparing access…
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={!containerUrl || uploading}
              className="w-[160px] justify-center"
            >
              <UploadCloud className="h-3 w-3 mr-2" /> Select Images
            </Button>
          )}
          <p className="text-[11px] text-muted-foreground mt-1">
            Choose image files to associate with this collection. Upload starts only when you press Upload.
            {!containerUrl && !uploadError && ' Waiting for write access URL…'}
          </p>
        </div>
        {selectedFiles.length > 0 && (
          <div className="border rounded-md p-2 max-h-48 overflow-auto space-y-2">
            {selectedFiles.map(f => (
              <div key={f.name} className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate" title={f.name}>{f.name}</span>
                <span className="text-muted-foreground">{(f.size/1024/1024).toFixed(2)} MB</span>
                <div className="w-32 h-2 bg-muted rounded overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${uploadProgress[f.name]||0}%`}} />
                </div>
                <span>{uploadProgress[f.name] ? `${uploadProgress[f.name]}%` : '0%'}</span>
              </div>
            ))}
          </div>
        )}
        <Separator />
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold">Existing Files</h4>
            <Button variant="ghost" size="sm" onClick={loadContainerListing} disabled={!containerUrl || listingLoading} className="h-6 px-2 text-[10px]">
              {listingLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Refresh'}
            </Button>
          </div>
          {!containerUrl && <p className="text-[10px] text-muted-foreground">Waiting for access…</p>}
          {listingError && <p className="text-[10px] text-red-600">{listingError}</p>}
          {containerUrl && !listingLoading && containerListing.length === 0 && !listingError && (
            <p className="text-[10px] text-muted-foreground">No files found in container.</p>
          )}
          {containerListing.length > 0 && (
            <div className="border rounded-md p-2 max-h-40 overflow-auto divide-y">
              {containerListing.map(item => (
                <div key={item.name} className="flex items-center justify-between gap-2 py-1 text-[11px]">
                  <span className="truncate max-w-[60%]" title={item.name}>{item.name}</span>
                  <span className="text-muted-foreground">{(item.size/1024).toFixed(1)} KB</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={()=>setUploadOpen(false)} disabled={uploading}>Close</Button>
        <Button onClick={uploadAll} disabled={uploading || !containerUrl || selectedFiles.length===0}>{uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Upload</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  </>
  );
};

export default RealityModelingComponent;

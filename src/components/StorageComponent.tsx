import { useEffect, useMemo, useState } from "react";
import { iTwinApiService, storageService, API_CONFIG } from "../services";
import type { iTwin } from "../services/iTwinAPIService";
import type { FileCreateLinksResponse, FolderListResponse, StorageFile, StorageFolder, StorageListItem, TopLevelListResponse } from "../services/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Folder, File, Loader2, Link as LinkIcon, Plus, Download, MoreHorizontal } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";

type Node = { kind: 'folder'; item: StorageFolder };
function isFile(item: StorageListItem): item is StorageFile & { type: 'file' } {
  return item.type === 'file';
}

export default function StorageComponent() {
  const [iTwins, setITwins] = useState<iTwin[]>([]);
  const [selectedITwinId, setSelectedITwinId] = useState("");
  const [loadingITwins, setLoadingITwins] = useState(false);

  const [rootFolderId, setRootFolderId] = useState<string | null>(null);
  const [path, setPath] = useState<Node[]>([]);
  const [items, setItems] = useState<StorageListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create folder/file state
  const [newFolderName, setNewFolderName] = useState("");
  const [newFileName, setNewFileName] = useState("");
  const [creating, setCreating] = useState(false);
  const [fileLinks, setFileLinks] = useState<FileCreateLinksResponse | null>(null);
  const currentFolderId = useMemo(() => (path.length ? path[path.length - 1].item.id : rootFolderId), [path, rootFolderId]);
  const [downloadLinks, setDownloadLinks] = useState<Record<string, string>>({});
  // Upload file (end-to-end) state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // Rename and Move modals state
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string; type: 'file' | 'folder'; name: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [moveOpen, setMoveOpen] = useState(false);
  const [moveTarget, setMoveTarget] = useState<{ id: string; type: 'file' | 'folder' } | null>(null);
  const [moveQuery, setMoveQuery] = useState('');
  const [moveSearching, setMoveSearching] = useState(false);
  const [moveResults, setMoveResults] = useState<StorageFolder[]>([]);
  const [moveSelectedFolderId, setMoveSelectedFolderId] = useState<string>('');

  const formatBytes = (bytes?: number): string => {
    if (bytes === undefined || bytes === null) return '-';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    let val = bytes;
    while (val >= 1024 && i < units.length - 1) {
      val /= 1024;
      i++;
    }
    return `${Math.round(val)} ${units[i]}`;
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingITwins(true); setError(null);
        const data = await iTwinApiService.getMyiTwins();
        setITwins(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load iTwins');
      } finally { setLoadingITwins(false); }
    };
    load();
  }, []);

  const loadTopLevel = async () => {
    if (!selectedITwinId) return;
    try {
      setLoading(true); setError(null); setFileLinks(null);
      const res: TopLevelListResponse = await storageService.getTopLevel(selectedITwinId);
      const folderHref = res._links.folder?.href;
      if (folderHref) {
        const folderId = folderHref.split('/').pop() ?? null;
        setRootFolderId(folderId);
        if (folderId) await loadFolder(folderId, true);
      } else {
        setError('Root folder link not found.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load top-level');
    } finally { setLoading(false); }
  };

  const loadFolder = async (folderId: string, resetPath = false) => {
    try {
      setLoading(true); setError(null); setFileLinks(null);
      const list: FolderListResponse = await storageService.listFolder(folderId);
      setItems(list.items);
      if (resetPath) {
        const folder = await storageService.getFolder(folderId);
        setPath([{ kind: 'folder', item: { ...folder.folder, type: 'folder' } }]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load folder');
    } finally { setLoading(false); }
  };

  const enter = async (entry: StorageListItem) => {
    if (entry.type === 'folder') {
      setPath((p) => [...p, { kind: 'folder', item: entry as StorageFolder }]);
      await loadFolder(entry.id);
    }
  };

  const goToCrumb = async (index: number) => {
    if (index < 0 || index >= path.length) return;
    const newPath = path.slice(0, index + 1);
    setPath(newPath);
    const folderId = newPath[newPath.length - 1].item.id;
    await loadFolder(folderId);
  };

  const goUp = async () => {
    if (path.length <= 1) return;
    const newPath = path.slice(0, -1);
    setPath(newPath);
  const parentId = newPath[newPath.length - 1]?.item.id as string;
    await loadFolder(parentId);
  };

  const onCreateFolder = async () => {
    if (!currentFolderId || !newFolderName.trim()) return;
    try {
      setCreating(true); setError(null);
      await storageService.createFolder(currentFolderId, { displayName: newFolderName.trim() });
      setNewFolderName("");
      await loadFolder(currentFolderId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create folder');
    } finally { setCreating(false); }
  };

  const onCreateFile = async () => {
    if (!currentFolderId || !newFileName.trim()) return;
    try {
      setCreating(true); setError(null);
      const links = await storageService.createFile(currentFolderId, { displayName: newFileName.trim() });
      setFileLinks(links);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create file');
    } finally { setCreating(false); }
  };

  const onComplete = async () => {
    if (!fileLinks?._links.completeUrl?.href) return;
    try {
      setCreating(true); setError(null);
      await storageService.completeByUrl(fileLinks._links.completeUrl.href);
      setFileLinks(null); setNewFileName("");
      if (currentFolderId) await loadFolder(currentFolderId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to complete file');
    } finally { setCreating(false); }
  };

  const onUploadSelectedFile = async () => {
    if (!currentFolderId || !uploadFile) return;
    setUploadError(null);
    setUploading(true);
    setUploadProgress(0);
    try {
      // 1) Create file metadata to obtain SAS upload and complete links
      const links = await storageService.createFile(currentFolderId, { displayName: uploadFile.name });
      const uploadUrl = links._links.uploadUrl?.href;
      const completeUrl = links._links.completeUrl?.href;
      if (!uploadUrl || !completeUrl) throw new Error('Upload links not provided');

      // 2) Upload bytes via SAS using XHR for progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader('x-ms-blob-type', 'BlockBlob');
        if (uploadFile.type) {
          try { xhr.setRequestHeader('Content-Type', uploadFile.type); } catch { /* ignore setting content-type errors in XHR */ }
        }
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const pct = Math.round((evt.loaded / evt.total) * 100);
            setUploadProgress(pct);
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed with status ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(uploadFile);
      });

      // 3) Complete file
      await storageService.completeByUrl(completeUrl);

      // 4) Reset and refresh
      setUploadFile(null);
      setUploadProgress(0);
      if (currentFolderId) await loadFolder(currentFolderId);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onDeleteFile = async (fileId: string) => {
    if (!currentFolderId) return;
    const ok = window.confirm('Delete this file?');
    if (!ok) return;
    try {
      setLoading(true); setError(null);
      await storageService.deleteFile(fileId);
      await loadFolder(currentFolderId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete file');
    } finally { setLoading(false); }
  };

  const onDeleteFolder = async (folderId: string) => {
    if (!currentFolderId) return;
    const ok = window.confirm('Delete this folder?');
    if (!ok) return;
    try {
      setLoading(true); setError(null);
      await storageService.deleteFolder(folderId);
      await loadFolder(currentFolderId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete folder');
    } finally { setLoading(false); }
  };

  const openRename = (id: string, type: 'file' | 'folder', currentName: string) => {
    setRenameTarget({ id, type, name: currentName });
    setRenameValue(currentName);
    setRenameOpen(true);
  };

  const confirmRename = async () => {
    if (!renameTarget || !renameValue.trim() || !currentFolderId) { setRenameOpen(false); return; }
    try {
      setCreating(true); setError(null);
      if (renameTarget.type === 'file') await storageService.updateFile(renameTarget.id, { displayName: renameValue.trim() });
      else await storageService.updateFolder(renameTarget.id, { displayName: renameValue.trim() });
      setRenameOpen(false);
      await loadFolder(currentFolderId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to rename');
    } finally { setCreating(false); }
  };

  const openMove = (id: string, type: 'file' | 'folder') => {
    setMoveTarget({ id, type });
    setMoveSelectedFolderId('');
    setMoveQuery('');
    setMoveResults([]);
    setMoveOpen(true);
  };

  const confirmMove = async () => {
    if (!moveTarget || !moveSelectedFolderId || !currentFolderId) { setMoveOpen(false); return; }
    try {
      setCreating(true); setError(null);
      if (moveTarget.type === 'file') await storageService.moveFile(moveTarget.id, moveSelectedFolderId);
      else await storageService.moveFolder(moveTarget.id, moveSelectedFolderId);
      setMoveOpen(false);
      await loadFolder(currentFolderId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to move');
    } finally { setCreating(false); }
  };

  // Debounced search for folders (simple debounce inside effect)
  useEffect(() => {
    let active = true;
    if (!moveOpen || !currentFolderId) return;
    if (!moveQuery.trim()) { setMoveResults([]); return; }
    setMoveSearching(true);
    const id = setTimeout(async () => {
      try {
        const res = await storageService.searchInFolder(currentFolderId, moveQuery.trim(), 20, 0);
        if (!active) return;
        const folders = res.items.filter((x) => x.type === 'folder').map(x => x as StorageFolder);
        setMoveResults(folders);
      } catch {
        if (!active) return;
        setMoveResults([]);
      } finally {
        if (active) setMoveSearching(false);
      }
    }, 350);
    return () => { active = false; clearTimeout(id); };
  }, [moveQuery, moveOpen, currentFolderId]);

  const getDownload = async (fileId: string) => {
    try {
      const cached = downloadLinks[fileId];
      if (cached) {
        const a = document.createElement('a');
        a.href = cached; a.target = '_blank'; a.rel = 'noopener noreferrer';
        a.click();
        return;
      }
      const loc = await storageService.getDownloadLocation(fileId);
      if (loc) {
        setDownloadLinks((m) => ({ ...m, [fileId]: loc }));
        const a = document.createElement('a');
        a.href = loc; a.target = '_blank'; a.rel = 'noopener noreferrer';
        a.click();
        return;
      }
      // Fallback: open API download endpoint and let browser follow redirect
      const fallback = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STORAGE.FILE_DOWNLOAD(fileId)}`;
      const a = document.createElement('a');
      a.href = fallback; a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.click();
  } catch {
      // Fallback even on failure
      const fallback = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STORAGE.FILE_DOWNLOAD(fileId)}`;
      const a = document.createElement('a');
      a.href = fallback; a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.click();
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Storage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tw">iTwin</Label>
            <div className="flex gap-2">
              <Select value={selectedITwinId} onValueChange={setSelectedITwinId}>
                <SelectTrigger id="tw" className="flex-1" disabled={loadingITwins}>
                  <SelectValue placeholder={loadingITwins ? 'Loading…' : 'Select an iTwin'} />
                </SelectTrigger>
                <SelectContent>
                  {iTwins.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.displayName} ({t.id.slice(0,8)}…)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={loadTopLevel} disabled={!selectedITwinId || loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}
                Load Storage
              </Button>
            </div>
          </div>

          

          <div className="grid md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Create folder</Label>
              <div className="flex gap-2">
                <Input placeholder="Folder name" value={newFolderName} onChange={(e)=>setNewFolderName(e.target.value)} />
                <Button onClick={onCreateFolder} disabled={!newFolderName.trim() || !currentFolderId || creating}><Plus className="h-4 w-4 mr-1"/>Create</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Create file (metadata)</Label>
              <div className="flex gap-2">
                <Input placeholder="File name (e.g., example.txt)" value={newFileName} onChange={(e)=>setNewFileName(e.target.value)} />
                <Button variant="outline" onClick={onCreateFile} disabled={!newFileName.trim() || !currentFolderId || creating}>Init</Button>
                {fileLinks?._links.uploadUrl?.href && (
                  <a className="text-xs underline flex items-center gap-1" href={fileLinks._links.uploadUrl.href} target="_blank" rel="noreferrer"><LinkIcon className="h-3 w-3"/>upload URL</a>
                )}
                <Button onClick={onComplete} disabled={!fileLinks?._links.completeUrl?.href || creating}>Complete</Button>
              </div>
              {fileLinks && <p className="text-[11px] text-muted-foreground">1) Open the upload URL in a new tab to PUT the file bytes (x-ms-blob-type: BlockBlob). 2) Click Complete.</p>}
            </div>
            <div className="space-y-2">
              <Label>Upload file</Label>
              <div className="flex flex-col gap-2">
                <Input type="file" onChange={(e)=> setUploadFile(e.target.files?.[0] ?? null)} disabled={uploading || !currentFolderId} />
                <div className="flex items-center gap-2">
                  <Button onClick={onUploadSelectedFile} disabled={!uploadFile || uploading || !currentFolderId}>
                    {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}
                    {uploading ? 'Uploading…' : 'Upload'}
                  </Button>
                  {uploadFile && !uploading && (
                    <span className="text-xs text-muted-foreground">{uploadFile.name} ({formatBytes(uploadFile.size)})</span>
                  )}
                </div>
                {uploading && (
                  <div className="h-2 w-full bg-muted rounded overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
                {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          {/* Breadcrumbs (moved here) */}
          <nav className="text-xs text-muted-foreground">
            {path.length > 0 ? (
              <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
                {path.map((node, idx) => (
                  <span key={node.item.id} className="flex items-center">
                    <button
                      type="button"
                      className={`underline hover:text-foreground ${idx === path.length - 1 ? 'font-medium no-underline cursor-default text-foreground' : ''}`}
                      onClick={() => (idx === path.length - 1 ? undefined : goToCrumb(idx))}
                      disabled={idx === path.length - 1}
                      title={node.item.displayName}
                    >
                      {idx === 0 ? (node.item.displayName || 'Root') : node.item.displayName}
                    </button>
                    {idx < path.length - 1 && <span className="px-1">/</span>}
                  </span>
                ))}
              </div>
            ) : (
              <span>-</span>
            )}
          </nav>

          <div className="border rounded">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="w-40">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {path.length > 1 && (
                  <TableRow onClick={goUp} className="cursor-pointer">
                    <TableCell><Folder className="h-4 w-4"/></TableCell>
                    <TableCell className="font-medium">..</TableCell>
                    <TableCell className="capitalize">folder</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                )}
                {items.map((it) => (
                  <TableRow key={`${it.type}-${it.id}`} onClick={() => it.type === 'folder' ? enter(it) : undefined} className={it.type === 'folder' ? 'cursor-pointer' : ''}>
                    <TableCell>{it.type === 'folder' ? <Folder className="h-4 w-4"/> : <File className="h-4 w-4"/>}</TableCell>
                    <TableCell className="font-medium">{it.displayName}</TableCell>
                    <TableCell className="capitalize">{it.type}</TableCell>
                    <TableCell>{isFile(it) ? formatBytes(it.size) : '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {it.type === 'file' && (
                          <Button size="sm" variant="ghost" onClick={(e)=>{ e.stopPropagation(); getDownload(it.id); }} title="Download">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" onClick={(e)=> e.stopPropagation()} title="More actions">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e)=> e.stopPropagation()}>
          {it.type === 'file' ? (
                              <>
            <DropdownMenuItem onSelect={(e)=>{ e.preventDefault(); openRename(it.id, 'file', it.displayName); }}>Rename</DropdownMenuItem>
            <DropdownMenuItem onSelect={(e)=>{ e.preventDefault(); openMove(it.id, 'file'); }}>Move…</DropdownMenuItem>
                                <DropdownMenuItem onSelect={(e)=>{ e.preventDefault(); onDeleteFile(it.id); }} variant="destructive">Delete file</DropdownMenuItem>
                              </>
                            ) : (
                              <>
            <DropdownMenuItem onSelect={(e)=>{ e.preventDefault(); openRename(it.id, 'folder', it.displayName); }}>Rename</DropdownMenuItem>
            <DropdownMenuItem onSelect={(e)=>{ e.preventDefault(); openMove(it.id, 'folder'); }}>Move…</DropdownMenuItem>
                                <DropdownMenuItem onSelect={(e)=>{ e.preventDefault(); onDeleteFolder(it.id); }} variant="destructive">Delete folder</DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">{loading ? 'Loading…' : 'No items'}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Rename dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent onClick={(e)=> e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Rename {renameTarget?.type}</DialogTitle>
            <DialogDescription>Enter a new name for this {renameTarget?.type}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rename">New name</Label>
            <Input id="rename" value={renameValue} onChange={(e)=> setRenameValue(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=> setRenameOpen(false)}>Cancel</Button>
            <Button onClick={confirmRename} disabled={!renameValue.trim() || creating}>{creating && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move dialog */}
      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent onClick={(e)=> e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Move {moveTarget?.type}</DialogTitle>
            <DialogDescription>Select a destination folder.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="search">Search folders</Label>
              <Input id="search" placeholder="Type to search by name..." value={moveQuery} onChange={(e)=> setMoveQuery(e.target.value)} />
            </div>
            <div className="border rounded max-h-60 overflow-auto">
              {moveSearching ? (
                <div className="p-3 text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> Searching…</div>
              ) : moveResults.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground">No folders found</div>
              ) : (
                <Table>
                  <TableBody>
                    {moveResults.map(f => (
                      <TableRow key={f.id} onClick={()=> setMoveSelectedFolderId(f.id)} className={"cursor-pointer " + (moveSelectedFolderId === f.id ? 'bg-accent/60' : '')}>
                        <TableCell className="w-8"><Folder className="h-4 w-4"/></TableCell>
                        <TableCell className="font-medium">{f.displayName}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{f.id.slice(0,8)}…</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=> setMoveOpen(false)}>Cancel</Button>
            <Button onClick={confirmMove} disabled={!moveSelectedFolderId || creating}>{creating && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}Move</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

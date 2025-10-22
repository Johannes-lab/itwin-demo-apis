import { useState } from 'react';
import { iModelService } from '../../services/api/IModelService';
import type { IModel } from '../../services/types/imodel.types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Pencil, Loader2 } from 'lucide-react';

interface Props {
  iModel: IModel;
  onUpdated: () => void;
  trigger?: React.ReactNode;
}

export function EditIModelModal({ iModel, onUpdated, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(iModel.displayName);
  const [desc, setDesc] = useState(iModel.description || '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const reset = () => {
    setName(iModel.displayName);
    setDesc(iModel.description || '');
    setErr(null);
  };

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      await iModelService.updateIModel(iModel.id, {
        displayName: name.trim(),
        description: desc.trim() || undefined,
      });
      setOpen(false);
      onUpdated();
    } catch (e: any) {
      setErr(e.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <span
        onClick={() => { reset(); setOpen(true); }}
        role="button"
        style={{ display: 'inline-flex', cursor: 'pointer' }}
      >
        {trigger || (
          <Button variant="outline" size="sm" title="Edit iModel">
            <Pencil className="w-4 h-4" />
          </Button>
        )}
      </span>
      <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); setOpen(v); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit iModel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1">Name *</label>
              <input
                className="w-full border rounded px-2 py-1 text-sm"
                value={name}
                disabled={saving}
                onChange={(e) => setName(e.target.value)}
                placeholder="iModel name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Description</label>
              <textarea
                className="w-full border rounded px-2 py-1 text-sm"
                rows={3}
                value={desc}
                disabled={saving}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Optional description"
              />
            </div>
            {err && <p className="text-xs text-red-600">{err}</p>}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!name.trim() || saving}
                onClick={save}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}